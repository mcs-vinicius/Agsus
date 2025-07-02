import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { theme } from './theme';

// --- Estilos Globais e do App (sem alterações) ---
const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 20px;
  }
`;

const AppContainer = styled.div`
  max-width: 1400px;
  margin: auto;
`;

const Header = styled.header`
  background-color: ${props => props.theme.colors.primary};
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 20px;
  box-shadow: ${props => props.theme.shadow};

  h1 {
    margin: 0;
    color: ${props => props.theme.colors.white};
  }
`;

const UploadSection = styled.div`
  background-color: ${props => props.theme.colors.white};
  padding: 20px;
  border-radius: 8px;
  box-shadow: ${props => props.theme.shadow};
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FileInputLabel = styled.label`
  font-weight: bold;
`;

const UploadButton = styled.button`
  padding: 10px 15px;
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.text};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color: 0.3s;

  &:hover {
    background-color: #ffafcc;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const Toolbar = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    align-items: center;
`;

const SearchInput = styled.input`
    padding: 8px;
    border-radius: 5px;
    border: 1px solid #ccc;
    width: 300px;
`;

const FilterSelect = styled.select`
    padding: 8px;
    border-radius: 5px;
    border: 1px solid #ccc;
`;

const DownloadButton = styled.a`
    padding: 8px 15px;
    background-color: ${props => props.theme.colors.success};
    color: ${props => props.theme.colors.text};
    border-radius: 5px;
    text-decoration: none;
    font-weight: bold;
    cursor: pointer;

    &:hover {
        background-color: #baffae;
    }
`;

const TableContainer = styled.div`
    overflow-x: auto;
    background-color: ${props => props.theme.colors.white};
    padding: 20px;
    border-radius: 8px;
    box-shadow: ${props => props.theme.shadow};

    table {
        width: 100%;
        border-collapse: collapse;

        th, td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }

        th {
            background-color: ${props => props.theme.colors.secondary};
        }
    }
`;

const TabContainer = styled.div`
    display: flex;
    margin-bottom: -1px;
`;

const TabButton = styled.button`
    padding: 10px 20px;
    cursor: pointer;
    border: 1px solid #ccc;
    border-bottom: none;
    background-color: ${props => props.$active ? props.theme.colors.white : '#f1f1f1'};
    border-radius: 8px 8px 0 0;
    font-weight: bold;
`;

// --- Componente App com as correções ---
function App() {
  const [inscricoesFile, setInscricoesFile] = useState(null);
  const [notasFile, setNotasFile] = useState(null);
  const [validStudents, setValidStudents] = useState([]);
  const [inconsistentData, setInconsistentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [activeTab, setActiveTab] = useState('validos');

  const handleUpload = async () => {
    if (!inscricoesFile || !notasFile) {
      alert('Por favor, selecione os dois arquivos.');
      return;
    }
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('inscricoes', inscricoesFile);
    formData.append('notas', notasFile);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(response.data.message);
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erro no upload');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
      try {
          const response = await axios.get('http://localhost:5000/api/students');
          setValidStudents(response.data.validos);
          setInconsistentData(response.data.inconsistentes);
      } catch (error) {
          console.error("Erro ao buscar dados:", error);
          // Em caso de erro, garante que os estados sejam arrays vazios
          setValidStudents([]);
          setInconsistentData([]);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const filteredStudents = useMemo(() => {
      // **CORREÇÃO PRINCIPAL AQUI**
      return (validStudents || [])
          .filter(student => 
              student.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
              student.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .filter(student => 
              statusFilter === 'Todos' || student.situacao === statusFilter
          );
  }, [searchTerm, statusFilter, validStudents]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Header><h1>Student Data Unifier</h1></Header>

        <UploadSection>
          <h2>1. Faça o Upload dos Arquivos</h2>
          <div>
            <FileInputLabel htmlFor="inscricoes">Arquivo de Inscrições (.csv): </FileInputLabel>
            <input type="file" id="inscricoes" accept=".csv" onChange={e => setInscricoesFile(e.target.files[0])} />
          </div>
          <div>
            <FileInputLabel htmlFor="notas">Arquivo de Notas (.csv): </FileInputLabel>
            <input type="file" id="notas" accept=".csv" onChange={e => setNotasFile(e.target.files[0])} />
          </div>
          <UploadButton onClick={handleUpload} disabled={loading}>
            {loading ? 'Processando...' : 'Processar e Salvar Dados'}
          </UploadButton>
          {message && <p>{message}</p>}
        </UploadSection>

        <h2>2. Visualize os Dados</h2>

        <TabContainer>
            <TabButton onClick={() => setActiveTab('validos')} $active={activeTab === 'validos'}>
                Alunos Válidos ({(filteredStudents || []).length})
            </TabButton>
            <TabButton onClick={() => setActiveTab('inconsistentes')} $active={activeTab === 'inconsistentes'}>
                {/* **CORREÇÃO DE SEGURANÇA AQUI** */}
                Dados Inconsistentes ({(inconsistentData || []).length})
            </TabButton>
        </TabContainer>

        {activeTab === 'validos' && (
            <TableContainer>
                <Toolbar>
                    <SearchInput 
                        type="text" 
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="Todos">Todos</option>
                        <option value="Aprovado">Aprovados</option>
                        <option value="Reprovado">Reprovados</option>
                        <option value="Não Avaliado">Não Avaliados</option>
                    </FilterSelect>
                    <DownloadButton href="http://localhost:5000/api/download" target="_blank">
                        Baixar .XLS
                    </DownloadButton>
                </Toolbar>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th><th>Nome</th><th>Email</th><th>Situação</th><th>Nota</th><th>Produto</th><th>Pedido</th>
                            <th>Nascimento</th><th>Gênero</th><th>Profissão</th><th>Estado</th><th>Concluído</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* **CORREÇÃO DE SEGURANÇA AQUI** */}
                        {(filteredStudents || []).map(student => (
                            <tr key={student.id}>
                                <td>{student.identificador}</td><td>{student.nome_completo}</td><td>{student.email}</td>
                                <td>{student.situacao}</td><td>{student.nota}</td><td>{student.produto}</td><td>{student.pedido}</td>
                                <td>{student.nascimento}</td><td>{student.genero}</td><td>{student.profissao}</td>
                                <td>{student.estado}</td><td>{student.concluido}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableContainer>
        )}
        {activeTab === 'inconsistentes' && (
            <TableContainer>
                <table>
                    <thead>
                        <tr>
                           <th>Motivo da Inconsistência</th>
                           <th>Dados Originais</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* **CORREÇÃO DE SEGURANÇA AQUI** */}
                        {(inconsistentData || []).map(item => (
                            <tr key={item.id}>
                                <td>{item.motivo_inconsistencia}</td>
                                <td>{item.dados_originais}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableContainer>
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default App; 