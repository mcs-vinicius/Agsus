// frontend/src/components/UploadScreen.js

import React, { useState } from 'react';
import axios from 'axios';
import {
    Section, UploadGrid, UploadButton, FileName,
    HiddenInput, FileInputLabel
} from '../StyledComponents';

// Componente de Input de Arquivo
const FileInput = ({ id, onChange, file, labelText, fileName }) => (
    <div>
        <HiddenInput id={id} accept=".csv" onChange={onChange} />
        <FileInputLabel htmlFor={id} $hasFile={!!file}>
            {labelText}
        </FileInputLabel>
        <FileName $hasFile={!!file} title={fileName}>
            {fileName || "Nenhum arquivo"}
        </FileName>
    </div>
);

const UploadScreen = () => {
    const [inscricoesFile, setInscricoesFile] = useState(null);
    const [notasFile, setNotasFile] = useState(null);
    const [progressoFile, setProgressoFile] = useState(null);
    const [inscricoesFileName, setInscricoesFileName] = useState('');
    const [notasFileName, setNotasFileName] = useState('');
    const [progressoFileName, setProgressoFileName] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e, setFile, setFileName) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            setFileName(file.name);
        }
    };

    const handleUpload = async () => {
        if (!inscricoesFile || !notasFile || !progressoFile) {
            alert('Por favor, selecione os três arquivos.');
            return;
        }
        setLoading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('inscricoes', inscricoesFile);
        formData.append('notas', notasFile);
        formData.append('progresso', progressoFile);

        try {
            const response = await axios.post('http://localhost:5000/api/upload', formData, {
                responseType: 'blob', // Importante: espera uma resposta que pode ser um arquivo
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Verifica se a resposta é o arquivo de erro
            if (response.headers['content-type'].includes('spreadsheetml')) {
                // Cria um link temporário para iniciar o download do arquivo de erros
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'Erros_Processamento.xlsx'); // Nome do arquivo
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);

                setMessage("Processamento concluído. Alguns alunos apresentaram inconsistências. Um arquivo de erros foi baixado.");
            } else {
                // Se não for um arquivo, tenta ler como JSON (caso de sucesso total ou erro crítico)
                const responseText = await response.data.text();
                const jsonResponse = JSON.parse(responseText);

                if(jsonResponse.message) {
                    setMessage(jsonResponse.message);
                } else {
                    setMessage(jsonResponse.error || 'Ocorreu um erro desconhecido.');
                }
            }
        } catch (error) {
            // Tenta ler a resposta de erro como JSON
            if (error.response && error.response.data) {
                try {
                    const errorText = await error.response.data.text();
                    const errorJson = JSON.parse(errorText);
                    setMessage(`Erro: ${errorJson.error}`);
                } catch (e) {
                    setMessage('Erro no processamento. Verifique o console do backend.');
                }
            } else {
                setMessage('Erro de conexão ou o servidor não respondeu.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Section>
            <h2>1. Faça o Upload dos Arquivos (.CSV)</h2>
            <p>Selecione os três arquivos para processamento. O sistema salvará os alunos válidos no banco de dados e, se houver inconsistências, um arquivo Excel com os detalhes será baixado automaticamente.</p>
            <UploadGrid>
                <FileInput 
                    id="inscricoes"
                    onChange={e => handleFileChange(e, setInscricoesFile, setInscricoesFileName)} 
                    file={inscricoesFile}
                    fileName={inscricoesFileName}
                    labelText="Inscrições"
                />
                <FileInput 
                    id="notas" 
                    onChange={e => handleFileChange(e, setNotasFile, setNotasFileName)} 
                    file={notasFile}
                    fileName={notasFileName}
                    labelText="Notas"
                />
                <FileInput 
                    id="progresso" 
                    onChange={e => handleFileChange(e, setProgressoFile, setProgressoFileName)} 
                    file={progressoFile}
                    fileName={progressoFileName}
                    labelText="Progresso"
                />
            </UploadGrid>
            <UploadButton onClick={handleUpload} disabled={loading || !inscricoesFile || !notasFile || !progressoFile}>
                {loading ? 'Processando...' : 'Processar e Salvar'}
            </UploadButton>
            {message && <p style={{ textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
        </Section>
    );
};

export default UploadScreen;