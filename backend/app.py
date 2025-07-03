# backend/app.py
import os
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import io
import uuid

load_dotenv() # Carrega variáveis do arquivo .env

# --- Configuração ---
app = Flask(__name__)
CORS(app) # Permite requisições do frontend

# --- Armazenamento em Memória ---
# Dicionário para armazenar os dataframes processados por requisição
dados_processados = {}

# --- Funções de Processamento de Dados ---

def processar_arquivos(file_inscricoes, file_notas):
    # Tenta ler os CSVs com diferentes separadores
    try:
        df_inscricoes = pd.read_csv(file_inscricoes, sep=';', keep_default_na=False, na_values=[''])
    except Exception:
        df_inscricoes = pd.read_csv(file_inscricoes, sep=',', keep_default_na=False, na_values=[''])

    try:
        df_notas = pd.read_csv(file_notas, sep=';', keep_default_na=False, na_values=[''])
    except Exception:
        df_notas = pd.read_csv(file_notas, sep=',', keep_default_na=False, na_values=[''])

    # --- Validação de Colunas Essenciais ---
    required_insc_cols = ['nome_inscricao', 'email_inscricao']
    if not all(col in df_inscricoes.columns for col in required_insc_cols):
        missing_cols = [col for col in required_insc_cols if col not in df_inscricoes.columns]
        raise ValueError(f"Arquivo 'Inscrições' inválido. Faltam as colunas: {', '.join(missing_cols)}")

    required_notas_cols = ['nome_nota', 'sobrenome_nota', 'email_nota']
    if not all(col in df_notas.columns for col in required_notas_cols):
        missing_cols = [col for col in required_notas_cols if col not in df_notas.columns]
        raise ValueError(f"Arquivo 'Notas' inválido. Faltam as colunas: {', '.join(missing_cols)}")

    # --- 1. Validação de campos em branco e separação de inconsistências ---
    inconsistentes = []

    # Checa inconsistências no arquivo de inscrições
    inscricoes_com_nulos = df_inscricoes[df_inscricoes.isnull().any(axis=1)]
    for _, row in inscricoes_com_nulos.iterrows():
        inconsistentes.append({'dados_originais': row.to_json(force_ascii=False), 'motivo_inconsistencia': 'Campo em branco no arquivo de Inscrições'})
    df_inscricoes.dropna(inplace=True)

    # Checa inconsistências no arquivo de notas (permitindo que 'nota' seja nulo ou '-')
    cols_to_check_notas = [col for col in df_notas.columns if col != 'nota']
    notas_com_nulos = df_notas[df_notas[cols_to_check_notas].isnull().any(axis=1)]
    for _, row in notas_com_nulos.iterrows():
        inconsistentes.append({'dados_originais': row.to_json(force_ascii=False), 'motivo_inconsistencia': 'Campo em branco no arquivo de Notas'})
    df_notas.dropna(subset=cols_to_check_notas, inplace=True)


    # --- 2. Processamento do arquivo de Inscrições ---
    df_inscricoes.rename(columns={'nome_inscricao': 'nome_completo', 'email_inscricao': 'email'}, inplace=True)
    df_inscricoes.drop_duplicates(subset=['nome_completo', 'email'], keep='first', inplace=True)


    # --- 3. Processamento do arquivo de Notas ---
    df_notas['nome_completo'] = df_notas['nome_nota'].astype(str) + ' ' + df_notas['sobrenome_nota'].astype(str)
    df_notas.rename(columns={'email_nota': 'email'}, inplace=True)
    df_notas.drop_duplicates(subset=['nome_completo', 'email'], keep='first', inplace=True)


    # --- 4. União (Merge) dos dois arquivos ---
    df_merged = pd.merge(df_inscricoes, df_notas, on=['nome_completo', 'email'], how='outer', indicator=True)
    
    nao_combinados = df_merged[df_merged['_merge'] != 'both']
    for _, row in nao_combinados.iterrows():
        motivo = 'Aluno presente apenas no arquivo de Notas' if row['_merge'] == 'right_only' else 'Aluno presente apenas no arquivo de Inscrições'
        inconsistentes.append({'dados_originais': row.to_json(force_ascii=False), 'motivo_inconsistencia': motivo})

    df_final = df_merged[df_merged['_merge'] == 'both'].copy()
    if df_final.empty:
        return df_final, pd.DataFrame(inconsistentes)

    # --- 5. Validação do campo "nota" e criação de "Situação" ---
    def calcular_situacao(nota):
        if pd.isna(nota) or str(nota).strip() == '-':
            return 'Não Avaliado'
        try:
            if float(nota) >= 7:
                return 'Aprovado'
            else:
                return 'Reprovado'
        except (ValueError, TypeError):
            return 'Não Avaliado'

    df_final['situacao'] = df_final['nota'].apply(calcular_situacao)
    df_final['nota'] = pd.to_numeric(df_final['nota'], errors='coerce')

    # Garante que todas as colunas esperadas existam no df_final, preenchendo com None se faltar
    colunas_finais = [
        'identificador', 'pedido', 'produto', 'nome_completo', 'nascimento',
        'genero', 'email', 'profissao', 'especialidade', 'vinculo',
        'cidade', 'estado', 'concluido', 'nota', 'situacao'
    ]
    for col in colunas_finais:
        if col not in df_final.columns:
            df_final[col] = None
            
    df_final = df_final[colunas_finais]

    # --- 6. Conversão de datas ---
    date_columns = ['pedido', 'nascimento', 'concluido']
    for col in date_columns:
        if col in df_final.columns:
            df_final[col] = pd.to_datetime(df_final[col], errors='coerce', dayfirst=True)


    return df_final, pd.DataFrame(inconsistentes)

# --- Endpoints da API ---

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'inscricoes' not in request.files or 'notas' not in request.files:
        return jsonify({"error": "Arquivos 'inscricoes' e 'notas' são obrigatórios"}), 400

    file_inscricoes = request.files['inscricoes']
    file_notas = request.files['notas']

    try:
        df_processado, df_inconsistente = processar_arquivos(file_inscricoes, file_notas)

        request_id = str(uuid.uuid4())
        
        dados_processados[request_id] = {
            "validos": df_processado,
            "inconsistentes": df_inconsistente
        }

        return jsonify({
            "message": "Arquivos processados com sucesso!",
            "requestId": request_id,
            "alunos_validos": len(df_processado),
            "alunos_inconsistentes": len(df_inconsistente)
        })

    except Exception as e:
        return jsonify({"error": f"Ocorreu um erro no processamento: {str(e)}"}), 500


@app.route('/api/students/<request_id>', methods=['GET'])
def get_students(request_id):
    if request_id not in dados_processados:
        return jsonify({"error": "Dados não encontrados para este ID."}), 404
        
    try:
        dados = dados_processados[request_id]
        df_validos = dados["validos"].copy()
        df_inconsistentes = dados["inconsistentes"].copy()

        # CORREÇÃO: Converte colunas de data para string antes de enviar como JSON
        date_columns = ['pedido', 'nascimento', 'concluido']
        for col in date_columns:
            if col in df_validos.columns:
                df_validos[col] = df_validos[col].dt.strftime('%d/%m/%Y').replace('NaT', None)
        
        return jsonify({
            "validos": df_validos.to_dict(orient='records'),
            "inconsistentes": df_inconsistentes.to_dict(orient='records')
        })
    except Exception as e:
        return jsonify({"error": f"Erro ao buscar dados: {str(e)}"}), 500

@app.route('/api/download/<request_id>', methods=['GET'])
def download_file(request_id):
    if request_id not in dados_processados:
        return jsonify({"error": "Dados não encontrados para este ID."}), 404

    try:
        df_export = dados_processados[request_id]["validos"].copy()

        # Formata as datas para o Excel
        date_columns = ['pedido', 'nascimento', 'concluido']
        for col in date_columns:
            if col in df_export.columns:
                 df_export[col] = pd.to_datetime(df_export[col]).dt.date
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl',
                            date_format='DD/MM/YYYY',
                            datetime_format='DD/MM/YYYY') as writer:
            df_export.to_excel(writer, index=False, sheet_name='Alunos Processados')
        
        output.seek(0)

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='alunos_processados.xlsx'
        )

    except Exception as e:
        return jsonify({"error": f"Erro ao gerar arquivo para download: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)