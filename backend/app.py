# backend/app.py

import os
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import io
import traceback
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from unidecode import unidecode

load_dotenv()

# --- Configuração ---
app = Flask(__name__)
CORS(app)

# --- Configuração do Banco de Dados ---
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root") # Verifique sua senha
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "student_db")

DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Funções ---
def normalize_text(text):
    if isinstance(text, str):
        return unidecode(text).lower()
    return text

def processar_arquivos_e_separar_erros(file_inscricoes, file_notas, file_progresso):
    try:
        # Tenta ler com separador ';' primeiro
        df_inscricoes = pd.read_csv(file_inscricoes, sep=';', keep_default_na=False, na_values=[''], encoding='utf-8-sig')
        df_notas = pd.read_csv(file_notas, sep=';', keep_default_na=False, na_values=[''], encoding='utf-8-sig')
        df_progresso = pd.read_csv(file_progresso, sep=';', keep_default_na=False, na_values=[''], encoding='utf-8-sig')
    except Exception:
        # Se falhar, tenta com ','
        file_inscricoes.seek(0); file_notas.seek(0); file_progresso.seek(0) # Reinicia o ponteiro dos arquivos
        df_inscricoes = pd.read_csv(file_inscricoes, sep=',', keep_default_na=False, na_values=[''], encoding='utf-8-sig')
        df_notas = pd.read_csv(file_notas, sep=',', keep_default_na=False, na_values=[''], encoding='utf-8-sig')
        df_progresso = pd.read_csv(file_progresso, sep=',', keep_default_na=False, na_values=[''], encoding='utf-8-sig')

    erros_list = []

    required_insc_cols = ['nome_inscricao', 'email_inscricao']
    inscricoes_error = df_inscricoes[df_inscricoes[required_insc_cols].isnull().any(axis=1)].copy()
    if not inscricoes_error.empty:
        inscricoes_error['motivo'] = 'Campos obrigatórios em branco (Inscrições)'
        erros_list.append(inscricoes_error)
        df_inscricoes.dropna(subset=required_insc_cols, inplace=True)

    required_notas_cols = ['nome_nota', 'sobrenome_nota', 'email_nota']
    notas_error = df_notas[df_notas[required_notas_cols].isnull().any(axis=1)].copy()
    if not notas_error.empty:
        notas_error['motivo'] = 'Campos obrigatórios em branco (Notas)'
        erros_list.append(notas_error)
        df_notas.dropna(subset=required_notas_cols, inplace=True)

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

    df_merged = pd.merge(df_inscricoes, df_notas, on='email', how='outer', indicator='merge_insc_notas')
    
    erros_merge1 = df_merged[df_merged['merge_insc_notas'] == 'right_only'].copy()
    if not erros_merge1.empty:
        erros_merge1['motivo'] = 'Aluno presente apenas no arquivo de Notas (sem inscrição)'
        erros_list.append(erros_merge1)

    df_merged = df_merged[df_merged['merge_insc_notas'] != 'right_only']
    df_merged['nome_completo'] = df_merged['nome_completo'].fillna(df_merged['nome_completo_temp'])

    df_final_merged = pd.merge(df_merged, df_progresso, on='nome_completo', how='outer', indicator='merge_progresso')

    erros_merge2 = df_final_merged[df_final_merged['merge_progresso'] == 'left_only'].copy()
    if not erros_merge2.empty:
        erros_merge2['motivo'] = 'Aluno sem progresso correspondente'
        erros_list.append(erros_merge2)
        
    erros_merge3 = df_final_merged[df_final_merged['merge_progresso'] == 'right_only'].copy()
    if not erros_merge3.empty:
        erros_merge3['motivo'] = 'Aluno presente apenas no arquivo de Progresso'
        erros_list.append(erros_merge3)

    df_validos = df_final_merged[df_final_merged['merge_progresso'] == 'both'].copy()

    if not df_validos.empty:
        date_columns = ['pedido', 'nascimento', 'concluido']
        for col in date_columns:
            if col in df_validos.columns:
                df_validos[col] = pd.to_datetime(df_validos[col], dayfirst=True, errors='coerce')

        notas_numericas = pd.to_numeric(df_validos['nota'], errors='coerce')

        def calcular_situacao(nota):
            if pd.isna(nota): return 'Não Avaliado'
            return 'Aprovado' if nota >= 7 else 'Reprovado'

        df_validos['situacao'] = notas_numericas.apply(calcular_situacao)
        df_validos['nota'] = notas_numericas

    df_erros_consolidados = pd.concat(erros_list, ignore_index=True) if erros_list else pd.DataFrame()
    return df_validos, df_erros_consolidados

def salvar_ou_atualizar_aluno(db_session, aluno_data):
    aluno_dict = dict(aluno_data)
    original_identificador = aluno_dict.get('identificador')
    email = aluno_dict.get('email')

    possible_ids = set()
    identificador_padronizado = None
    if original_identificador is not None:
        try:
            num_float = float(original_identificador)
            num_int = int(num_float)
            identificador_padronizado = str(num_int)
            possible_ids.add(str(num_int))
            possible_ids.add(str(num_float))
        except (ValueError, TypeError):
            identificador_padronizado = str(original_identificador)
            possible_ids.add(identificador_padronizado)
    else:
        identificador_padronizado = str(email)
        possible_ids.add(identificador_padronizado)
    aluno_dict['identificador'] = identificador_padronizado

    existing_record = db_session.execute(text("SELECT identificador, email FROM alunos WHERE identificador IN :ids"),{"ids": list(possible_ids)}).fetchone()

    if existing_record:
        db_session.execute(text("""UPDATE alunos SET identificador = :identificador, pedido = :pedido, produto = :produto, nome_completo = :nome_completo, nascimento = :nascimento, genero = :genero, email = :email, profissao = :profissao, especialidade = :especialidade, vinculo = :vinculo, cidade = :cidade, estado = :estado, concluido = :concluido, nota = :nota, progresso = :progresso, situacao = :situacao WHERE identificador = :existing_id"""), {**aluno_dict, "existing_id": existing_record.identificador})
    else:
        email_conflict = db_session.execute(text("SELECT identificador FROM alunos WHERE email = :email"),{"email": email}).fetchone()
        if email_conflict:
            raise ValueError(f"Erro de duplicidade: O email '{email}' já está em uso pelo identificador '{email_conflict.identificador}'.")
        db_session.execute(text("""INSERT INTO alunos (identificador, pedido, produto, nome_completo, nascimento, genero, email, profissao, especialidade, vinculo, cidade, estado, concluido, nota, progresso, situacao) VALUES (:identificador, :pedido, :produto, :nome_completo, :nascimento, :genero, :email, :profissao, :especialidade, :vinculo, :cidade, :estado, :concluido, :nota, :progresso, :situacao)"""), aluno_dict)

# --- ROTAS DA API ---

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'inscricoes' not in request.files or 'notas' not in request.files or 'progresso' not in request.files:
        return jsonify({"error": "Arquivos 'inscricoes', 'notas' e 'progresso' são obrigatórios"}), 400
    try:
        df_validos, df_erros = processar_arquivos_e_separar_erros(request.files['inscricoes'], request.files['notas'], request.files['progresso'])
        db_session = SessionLocal()
        try:
            df_sql = df_validos.astype(object).where(df_validos.notna(), None)
            for _, row in df_sql.iterrows():
                try:
                    salvar_ou_atualizar_aluno(db_session, row)
                except ValueError as e:
                    error_row = row.to_frame().T
                    error_row['motivo'] = str(e)
                    df_erros = pd.concat([df_erros, error_row], ignore_index=True)
            db_session.commit()
        except Exception as db_error:
            db_session.rollback()
            raise db_error
        finally:
            db_session.close()

        if not df_erros.empty:
            output = io.BytesIO()
            df_erros.to_excel(output, index=False, sheet_name='Inconsistencias')
            output.seek(0)
            return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', as_attachment=True, download_name='Erros_Processamento.xlsx')
        
        return jsonify({"message": f"{len(df_validos)} alunos foram processados e salvos com sucesso!"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Ocorreu um erro crítico no servidor: {str(e)}"}), 500

# --- ROTAS DE GERENCIAMENTO DE ALUNOS (QUE ESTAVAM FALTANDO) ---

@app.route('/api/alunos', methods=['GET'])
def get_all_alunos():
    query = request.args.get('search', '')
    db_session = SessionLocal()
    try:
        sql_query = text("SELECT * FROM alunos WHERE nome_completo LIKE :query OR email LIKE :query")
        result = db_session.execute(sql_query, {"query": f"%{query}%"}).fetchall()
        
        alunos = [dict(row._mapping) for row in result]
        if not alunos and query: # Se a busca não retornou nada
             return jsonify([]), 200 # Retorna lista vazia em vez de 404
        if not alunos and not query: # Se não há alunos no banco
            return jsonify([]), 200

        return jsonify(alunos)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Erro ao buscar alunos: {str(e)}"}), 500
    finally:
        db_session.close()

@app.route('/api/alunos/<aluno_id>', methods=['PUT'])
def update_aluno(aluno_id):
    data = request.json
    db_session = SessionLocal()
    try:
        with db_session.begin():
            db_session.execute(text("""UPDATE alunos SET nome_completo = :nome_completo, email = :email, nascimento = :nascimento, genero = :genero, profissao = :profissao, especialidade = :especialidade, vinculo = :vinculo, cidade = :cidade, estado = :estado, nota = :nota, progresso = :progresso, situacao = :situacao WHERE identificador = :id"""), {**data, "id": aluno_id})
        return jsonify({"message": "Aluno atualizado com sucesso!"})
    except Exception as e:
        traceback.print_exc()
        db_session.rollback()
        return jsonify({"error": f"Erro ao atualizar aluno: {str(e)}"}), 500
    finally:
        db_session.close()

@app.route('/api/alunos/download', methods=['GET'])
def download_alunos_db():
    query = request.args.get('search', '')
    db_session = SessionLocal()
    try:
        sql_query = text("SELECT * FROM alunos WHERE nome_completo LIKE :query OR email LIKE :query")
        result = db_session.execute(sql_query, {"query": f"%{query}%"}).fetchall()
        
        alunos = [dict(row._mapping) for row in result]
        if not alunos:
            return jsonify({"error": "Nenhum aluno encontrado para download."}), 404
            
        df_export = pd.DataFrame(alunos)
        date_columns = ['pedido', 'nascimento', 'concluido']
        for col in date_columns:
            if col in df_export.columns:
                 df_export[col] = pd.to_datetime(df_export[col]).dt.date

        current_date = datetime.now().strftime('%d-%m-%Y')
        download_name = f'Alunos_Registrados_AGsus_{current_date}.xlsx'
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl', date_format='DD/MM/YYYY') as writer:
            df_export.to_excel(writer, index=False, sheet_name='Alunos Registrados')
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', as_attachment=True, download_name=download_name)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Erro ao gerar arquivo para download: {str(e)}"}), 500
    finally:
        db_session.close()

# --- INICIALIZAÇÃO ---
if __name__ == '__main__':
    with engine.connect() as connection:
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS alunos (
                identificador VARCHAR(255) PRIMARY KEY,
                pedido DATE,
                produto VARCHAR(255),
                nome_completo VARCHAR(255),
                nascimento DATE,
                genero VARCHAR(50),
                email VARCHAR(255) UNIQUE,
                profissao VARCHAR(255),
                especialidade VARCHAR(255),
                vinculo VARCHAR(255),
                cidade VARCHAR(255),
                estado VARCHAR(255),
                concluido DATE,
                nota INT,
                progresso VARCHAR(50),
                situacao VARCHAR(50)
            );
        """))
    app.run(debug=True, port=5000)