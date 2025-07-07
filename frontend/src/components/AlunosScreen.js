// frontend/src/components/AlunosScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Section, TableContainer, Toolbar } from '../StyledComponents.js';
import styled from 'styled-components';

// --- Seus Componentes de Estilo (sem alterações) ---
const AlunosSearchInput = styled.input`
    padding: 10px; border-radius: 5px; border: 1px solid ${props => props.theme.colors.secondary};
    background-color: ${props => props.theme.colors.darkBlue}; color: ${props => props.theme.colors.text};
    width: 350px; transition: all 0.3s ease;
    &:focus { outline: none; box-shadow: ${props => props.theme.shadows.glowAccent}; border-color: ${props => props.theme.colors.accent}; }
`;
const EditInput = styled.input`
    width: 100%; padding: 8px; background-color: #1a1a3a;
    border: 1px solid #4a4a8a; color: #f0f0f0; border-radius: 4px;
`;
const ActionButton = styled.button`
    padding: 8px 12px; margin: 0 5px; border: none; border-radius: 4px;
    cursor: pointer; font-weight: bold; transition: transform 0.2s ease;
    &:hover { transform: scale(1.1); }
    &.edit { background-color: ${props => props.theme.colors.primary}; color: white; }
    &.save { background-color: ${props => props.theme.colors.success}; color: ${props => props.theme.colors.dark}; }
    &.cancel { background-color: #777; color: white; }
`;
const ManagementDownloadButton = styled.a`
    padding: 10px 18px; background-color: ${props => props.theme.colors.success};
    color: ${props => props.theme.colors.dark}; border-radius: 5px; text-decoration: none;
    font-weight: bold; cursor: pointer; transition: all 0.3s ease;
    box-shadow: ${props => props.theme.shadows.glowSuccess}; margin-left: auto;
    &:hover { transform: scale(1.05); box-shadow: 0 0 20px ${props => props.theme.shadows.glowSuccess}; }
`;

// --- Componente Principal da Tela ---
const AlunosScreen = () => {
    const [alunos, setAlunos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingAlunoId, setEditingAlunoId] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchAlunos = async (search = '') => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/alunos?search=${search}`);
            setAlunos(response.data);
        } catch (error) {
            console.error("Erro ao buscar alunos:", error);
            alert("Não foi possível carregar os dados dos alunos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAlunos(); }, []);
    const handleSearchSubmit = (e) => { e.preventDefault(); fetchAlunos(searchTerm); };
    
    const handleEdit = (aluno) => {
        setEditingAlunoId(aluno.identificador);
        
        // Converte a data do formato GMT para 'AAAA-MM-DD' para o campo de edição
        let birthDateForInput = '';
        if (aluno.nascimento) {
            const date = new Date(aluno.nascimento);
            if (!isNaN(date.getTime())) {
                // Usa getUTCFullYear, etc., para evitar problemas de fuso horário
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                birthDateForInput = `${year}-${month}-${day}`;
            }
        }
        setFormData({ ...aluno, nascimento: birthDateForInput });
    };

    const handleCancel = () => { setEditingAlunoId(null); setFormData({}); };
    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const handleSave = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/alunos/${id}`, formData);
            alert('Aluno salvo com sucesso!');
            setEditingAlunoId(null);
            fetchAlunos(searchTerm);
        } catch (error) {
            console.error("Erro ao salvar aluno:", error);
            alert('Erro ao salvar as informações.');
        }
    };

    // ---- FUNÇÃO DE FORMATAR DATA (VERSÃO FINAL E CORRETA) ----
    const formatDate = (dateString) => {
        if (!dateString) {
            return '';
        }
        // new Date() consegue interpretar o formato 'Thu, 13 Mar 1997 00:00:00 GMT'
        const date = new Date(dateString);
        
        // Verifica se a data é válida após a conversão
        if (isNaN(date.getTime())) {
            return dateString; // Retorna o original se a data for inválida
        }
        
        // Usamos os métodos UTC para ignorar o fuso horário local e pegar a data correta
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        
        return `${day}/${month}/${year}`;
    };

    const columns = ["nome_completo", "email", "nascimento", "nota", "progresso", "situacao"];

    return (
        <Section>
            <h2>Gerenciar Alunos Registrados</h2>
            <Toolbar as="form" onSubmit={handleSearchSubmit}>
                <AlunosSearchInput type="text" placeholder="Pesquisar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <ActionButton type="submit" className="edit">Pesquisar</ActionButton>
                <ManagementDownloadButton href={`http://localhost:5000/api/alunos/download?search=${searchTerm}`} target="_blank" download>
                    Baixar Planilha
                </ManagementDownloadButton>
            </Toolbar>
            <TableContainer>
                <table>
                    <thead>
                        <tr>
                            {columns.map(col => <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>)}
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={columns.length + 1}>Carregando...</td></tr>
                        ) : alunos.map((aluno) => (
                            <tr key={aluno.identificador}>
                                {editingAlunoId === aluno.identificador ? (
                                    <>
                                        <td><EditInput name="nome_completo" value={formData.nome_completo || ''} onChange={handleChange} /></td>
                                        <td><EditInput name="email" value={formData.email || ''} onChange={handleChange} /></td>
                                        <td><EditInput type="date" name="nascimento" value={formData.nascimento || ''} onChange={handleChange} /></td>
                                        <td><EditInput name="nota" value={formData.nota || ''} onChange={handleChange} /></td>
                                        <td><EditInput name="progresso" value={formData.progresso || ''} onChange={handleChange} /></td>
                                        <td><EditInput name="situacao" value={formData.situacao || ''} onChange={handleChange} /></td>
                                        <td>
                                            <ActionButton className="save" onClick={() => handleSave(aluno.identificador)}>Salvar</ActionButton>
                                            <ActionButton className="cancel" onClick={handleCancel}>Cancelar</ActionButton>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{aluno.nome_completo}</td>
                                        <td>{aluno.email}</td>
                                        <td>{formatDate(aluno.nascimento)}</td>
                                        <td>{aluno.nota}</td>
                                        <td>{aluno.progresso}</td>
                                        <td>{aluno.situacao}</td>
                                        <td>
                                            <ActionButton className="edit" onClick={() => handleEdit(aluno)}>Editar</ActionButton>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableContainer>
        </Section>
    );
};

export default AlunosScreen;