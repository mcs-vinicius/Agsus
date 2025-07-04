# backend/app.py
import os
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import io
import uuid
from unidecode import unidecode
from datetime import datetime

load_dotenv()  # Carrega variáveis do arquivo .env

# --- Configuração ---
app = Flask(__name__)
CORS(app)  # Permite requisições do frontend

# --- Armazenamento em Memória ---
# Dicionário para armazenar os dataframes processados por requisição
dados_processados = {}

# --- Funções de Processamento de Dados ---

def normalize_text(text):
    """Remove acentos e converte para minúsculas."""
    if isinstance(text, str):
        return unidecode(text).lower()
    return text

def processar_arquivos(file_inscricoes, file_notas, file_progresso):
    # Tenta ler os CSVs com a codificação UTF-8 e diferentes separadores
    try:
        df_inscricoes = pd.read_csv(file_inscricoes, sep=';', keep_default_na=False, na_values=[''], encoding='utf-8-sig')
    except Exception:
        df_inscricoes = pd.read_csv(file_inscricoes, sep=',', keep_default_na=False, na_values=[''], encoding='utf-8-sig')

    try:
        df_notas = pd.read_csv(file_notas, sep=';', keep_default_na=False, na_values=[''], encoding='utf-8-sig')
    except Exception:
        df_notas = pd.read_csv(file_notas, sep=',', keep_default_na=False, na_values=[''], encoding='utf-8-sig')

    try:
        df_progresso = pd.read_csv(file_progresso, sep=';', keep_default_na=False, na_values=[''], encoding='utf-8-sig')
    except Exception:
        df_progresso = pd.read_csv(file_progresso, sep=',', keep_default_na=False, na_values=[''], encoding='utf-8-sig')


    # --- Validação de Colunas Essenciais ---
    required_insc_cols = ['nome_inscricao', 'email_inscricao']
    if not all(col in df_inscricoes.columns for col in required_insc_cols):
        missing_cols = [col for col in required_insc_cols if col not in df_inscricoes.columns]
        raise ValueError(f"Arquivo 'Inscrições' inválido. Faltam as colunas: {', '.join(missing_cols)}")

    required_notas_cols = ['nome_nota', 'sobrenome_nota', 'email_nota']
    if not all(col in df_notas.columns for col in required_notas_cols):
        missing_cols = [col for col in required_notas_cols if col not in df_notas.columns]
        raise ValueError(f"Arquivo 'Notas' inválido. Faltam as colunas: {', '.join(missing_cols)}")

    required_progresso_cols = ['nome_progresso']
    if not all(col in df_progresso.columns for col in required_progresso_cols):
        missing_cols = [col for col in required_progresso_cols if col not in df_progresso.columns]
        raise ValueError(f"Arquivo 'Progresso' inválido. Faltam as colunas: {', '.join(missing_cols)}")

    # --- 1. Separação de inconsistências (campos obrigatórios vazios) ---
    inscricoes_error = df_inscricoes[df_inscricoes[required_insc_cols].isnull().any(axis=1)].copy()
    inscricoes_error['motivo'] = 'Campo obrigatório em branco no arquivo de Inscrições'
    df_inscricoes.dropna(subset=required_insc_cols, inplace=True)

    notas_error = df_notas[df_notas[required_notas_cols].isnull().any(axis=1)].copy()
    notas_error['motivo'] = 'Campo obrigatório em branco no arquivo de Notas'
    df_notas.dropna(subset=required_notas_cols, inplace=True)

    progresso_error = df_progresso[df_progresso[required_progresso_cols].isnull().any(axis=1)].copy()
    progresso_error['motivo'] = 'Campo obrigatório em branco no arquivo de Progresso'
    df_progresso.dropna(subset=required_progresso_cols, inplace=True)


    # --- 2. Processamento dos arquivos ---
    df_inscricoes.rename(columns={'nome_inscricao': 'nome_completo', 'email_inscricao': 'email'}, inplace=True)
    df_inscricoes['nome_completo'] = df_inscricoes['nome_completo'].apply(normalize_text)
    df_inscricoes['email'] = df_inscricoes['email'].str.lower()
    df_inscricoes.drop_duplicates(subset=['email'], keep='first', inplace=True)

    df_notas['nome_completo_temp'] = (df_notas['nome_nota'].astype(str) + ' ' + df_notas['sobrenome_nota'].astype(str)).apply(normalize_text)
    df_notas.rename(columns={'email_nota': 'email'}, inplace=True)
    df_notas['email'] = df_notas['email'].str.lower()
    df_notas.drop_duplicates(subset=['email'], keep='first', inplace=True)

    df_progresso.rename(columns={'nome_progresso': 'nome_completo'}, inplace=True)
    df_progresso['nome_completo'] = df_progresso['nome_completo'].apply(normalize_text)
    df_progresso.drop_duplicates(subset=['nome_completo'], keep='first', inplace=True)


    # --- 3. União (Merge) dos arquivos Inscrição e Notas por E-MAIL ---
    df_merged_insc_notas = pd.merge(
        df_inscricoes,
        df_notas,
        on='email',
        how='outer',
        indicator='merge_insc_notas'
    )

    # Cria a coluna 'nome_completo' final, priorizando o nome do arquivo de inscrições
    df_merged_insc_notas['nome_completo'] = df_merged_insc_notas['nome_completo'].fillna(df_merged_insc_notas['nome_completo_temp'])
    df_merged_insc_notas.drop(columns=['nome_completo_temp'], inplace=True)


    # --- 4. Merge com o arquivo de progresso por NOME COMPLETO ---
    df_merged_final = pd.merge(df_merged_insc_notas, df_progresso, on='nome_completo', how='outer', indicator='merge_progresso')

    # Identificar e separar inconsistências de merge
    insc_error_merge = df_merged_final[df_merged_final['merge_insc_notas'] == 'right_only'].copy()
    insc_error_merge['motivo'] = 'Aluno presente apenas no arquivo de Notas'

    notas_error_merge = df_merged_final[df_merged_final['merge_insc_notas'] == 'left_only'].copy()
    notas_error_merge['motivo'] = 'Aluno presente apenas no arquivo de Inscrições'

    progresso_error_merge = df_merged_final[df_merged_final['merge_progresso'] == 'right_only'].copy()
    progresso_error_merge['motivo'] = 'Aluno presente apenas no arquivo de Progresso'

    inscricoes_error = pd.concat([inscricoes_error, insc_error_merge, notas_error_merge])
    progresso_error = pd.concat([progresso_error, progresso_error_merge])

    df_final = df_merged_final[(df_merged_final['merge_insc_notas'] == 'both') & (df_merged_final['merge_progresso'] != 'right_only')].copy()

    if df_final.empty:
        return df_final, inscricoes_error, notas_error, progresso_error


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

    # Garante que todas as colunas esperadas existam no df_final
    colunas_finais = [
        'identificador', 'pedido', 'produto', 'nome_completo', 'nascimento',
        'genero', 'email', 'profissao', 'especialidade', 'vinculo',
        'cidade', 'estado', 'concluido', 'nota', 'progresso', 'situacao'
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

    return df_final, inscricoes_error, notas_error, progresso_error

# --- Endpoints da API ---

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'inscricoes' not in request.files or 'notas' not in request.files or 'progresso' not in request.files:
        return jsonify({"error": "Arquivos 'inscricoes', 'notas' e 'progresso' são obrigatórios"}), 400

    file_inscricoes = request.files['inscricoes']
    file_notas = request.files['notas']
    file_progresso = request.files['progresso']

    try:
        df_processado, df_inscricoes_error, df_notas_error, df_progresso_error = processar_arquivos(
            file_inscricoes, file_notas, file_progresso
        )

        request_id = str(uuid.uuid4())
        
        dados_processados[request_id] = {
            "validos": df_processado,
            "inscricoes_error": df_inscricoes_error,
            "notas_error": df_notas_error,
            "progresso_error": df_progresso_error,
        }

        return jsonify({
            "message": "Arquivos processados com sucesso!",
            "requestId": request_id,
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
        
        # --- AJUSTE IMPORTANTE ---
        # Converte todos os valores NaN/NaT para None (que se torna 'null' em JSON)
        # Isso garante que o frontend receba um formato consistente.
        df_validos = df_validos.astype(object).where(pd.notnull(df_validos), None)

        # Converte colunas de data para string, tratando os valores 'None' que acabamos de definir
        date_columns = ['pedido', 'nascimento', 'concluido']
        for col in date_columns:
            if col in df_validos.columns:
                # Garante que a coluna é do tipo datetime antes de tentar formatar
                df_validos[col] = pd.to_datetime(df_validos[col], errors='coerce')
                # Agora, formata para string, valores NaT (após coerce) virarão None
                df_validos[col] = df_validos[col].dt.strftime('%d/%m/%Y').replace({pd.NaT: None})

        # Prepara os dataframes de erro da mesma forma para consistência
        df_inscricoes_error = dados["inscricoes_error"].astype(object).where(pd.notnull(dados["inscricoes_error"]), None)
        df_notas_error = dados["notas_error"].astype(object).where(pd.notnull(dados["notas_error"]), None)
        df_progresso_error = dados["progresso_error"].astype(object).where(pd.notnull(dados["progresso_error"]), None)

        return jsonify({
            "validos": df_validos.to_dict(orient='records'),
            "inscricoes_error": df_inscricoes_error.to_dict(orient='records'),
            "notas_error": df_notas_error.to_dict(orient='records'),
            "progresso_error": df_progresso_error.to_dict(orient='records'),
        })
    except Exception as e:
        # Adiciona um print para depuração no console do backend
        print(f"Erro detalhado no endpoint /api/students: {e}")
        return jsonify({"error": f"Erro ao buscar dados: {str(e)}"}), 500

@app.route('/api/download/<request_id>', methods=['GET'])
def download_file(request_id):
    if request_id not in dados_processados:
        return jsonify({"error": "Dados não encontrados para este ID."}), 404

    try:
        dados = dados_processados[request_id]
        df_export = dados["validos"].copy()
        df_inscricoes_error = dados["inscricoes_error"].copy()
        df_notas_error = dados["notas_error"].copy()
        df_progresso_error = dados["progresso_error"].copy()


        # Formata as datas para o Excel
        date_columns = ['pedido', 'nascimento', 'concluido']
        for col in date_columns:
            if col in df_export.columns:
                 df_export[col] = pd.to_datetime(df_export[col]).dt.date
        
        # --- AJUSTE PARA O NOME DO ARQUIVO ---
         # Altera o formato da data para DD-MM-YYYY
        current_date = datetime.now().strftime('%d-%m-%Y') 
        # Cria o nome do arquivo dinâmico
        download_name = f'Alunos AGsus {current_date}.xlsx'
        # --- FIM DO AJUSTE ---


        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl',
                            date_format='DD/MM/YYYY',
                            datetime_format='DD/MM/YYYY') as writer:
            df_export.to_excel(writer, index=False, sheet_name='Alunos Processados')
            df_inscricoes_error.to_excel(writer, index=False, sheet_name='Inscrições ERROR')
            df_notas_error.to_excel(writer, index=False, sheet_name='Nota ERROR')
            df_progresso_error.to_excel(writer, index=False, sheet_name='Progresso ERROR')
        
        output.seek(0)

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=download_name
        )

    except Exception as e:
        return jsonify({"error": f"Erro ao gerar arquivo para download: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)