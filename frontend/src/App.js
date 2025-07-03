import React, { useState, useMemo } from 'react';
import axios from 'axios';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { theme } from './theme';

// --- Estilos (sem alterações, mantidos como na versão anterior) ---

const GlobalStyle = createGlobalStyle`
  body {
    background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
    color: ${props => props.theme.colors.text};
    font-family: 'Orbitron', sans-serif; /* Fonte com tema espacial */
    margin: 0;
    padding: 20px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
    text-shadow: ${props => props.theme.shadows.textGlow};
  }
`;

const AppContainer = styled.div`
  max-width: 1400px;
  margin: auto;
  animation: fadeIn 1s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Header = styled.header`
  background: linear-gradient(145deg, rgba(13,13,43,0.8), rgba(26,26,58,0.8));
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 30px;
  border: 1px solid ${props => props.theme.colors.secondary};
  box-shadow: ${props => props.theme.shadows.glowPrimary};

  h1 {
    margin: 0;
    color: ${props => props.theme.colors.white};
    font-size: 2.5em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
`;

const UploadSection = styled.div`
  background: rgba(26, 26, 58, 0.6);
  padding: 30px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.accent};
  box-shadow: ${props => props.theme.shadows.glowAccent};
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FileInputLabel = styled.label`
  font-weight: bold;
  font-size: 1.1em;
  color: ${props => props.theme.colors.secondary};
`;

const UploadButton = styled.button`
  padding: 12px 20px;
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.white};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s;
  box-shadow: ${props => props.theme.shadows.glowAccent};

  &:hover:not(:disabled) {
    transform: scale(1.05);
    background-color: #ff33ff;
  }
  &:disabled {
    background-color: #555;
    box-shadow: none;
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
    padding: 10px;
    border-radius: 5px;
    border: 1px solid ${props => props.theme.colors.secondary};
    background-color: ${props => props.theme.colors.darkBlue};
    color: ${props => props.theme.colors.text};
    width: 300px;
`;

const FilterSelect = styled.select`
    padding: 10px;
    border-radius: 5px;
    border: 1px solid ${props => props.theme.colors.secondary};
    background-color: ${props => props.theme.colors.darkBlue};
    color: ${props => props.theme.colors.text};
`;

const DownloadButton = styled.a`
    padding: 10px 18px;
    background-color: ${props => props.theme.colors.success};
    color: ${props => props.theme.colors.dark};
    border-radius: 5px;
    text-decoration: none;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: ${props => props.theme.shadows.glowSuccess};

    &.disabled {
        background-color: #555;
        box-shadow: none;
        cursor: not-allowed;
        pointer-events: none;
    }

    &:hover:not(.disabled) {
        transform: scale(1.05);
    }
`;

const TableContainer = styled.div`
    overflow-x: auto;
    background: rgba(13, 13, 43, 0.7);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid ${props => props.theme.colors.secondary};
    box-shadow: ${props => props.theme.shadows.glowPrimary};

    table {
        width: 100%;
        border-collapse: collapse;

        th, td {
            padding: 15px;
            border-bottom: 1px solid ${props => props.theme.colors.secondary};
            text-align: left;
        }

        th {
            background-color: ${props => props.theme.colors.primary};
            color: ${props => props.theme.colors.secondary};
            text-transform: uppercase;
        }

        tr:hover {
          background-color: ${props => props.theme.colors.darkBlue};
        }
    }
`;

const TabContainer = styled.div`
    display: flex;
    margin-bottom: 0px;
`;

const TabButton = styled.button`
    padding: 12px 24px;
    cursor: pointer;
    border: 1px solid ${props => props.$active ? props.theme.colors.secondary : '#444'};
    border-bottom: none;
    background: ${props => props.$active ? 'rgba(13, 13, 43, 0.9)' : 'rgba(26, 26, 58, 0.7)'};
    color: ${props => props.$active ? props.theme.colors.secondary : props.theme.colors.text};
    border-radius: 8px 8px 0 0;
    font-weight: bold;
    transition: all 0.3s;
    
    &:hover {
        background: rgba(13, 13, 43, 0.9);
        color: ${props => props.theme.colors.secondary};
    }
`;


// --- Componente Principal ---

function App() {
  const [inscricoesFile, setInscricoesFile] = useState(null);
  const [notasFile, setNotasFile] = useState(null);
  const [validStudents, setValidStudents] = useState([]);
  const [inconsistentData, setInconsistentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [activeTab, setActiveTab] = useState('validos');

  const clearData = () => {
    setValidStudents([]);
    setInconsistentData([]);
    setMessage('');
    setRequestId(null);
    setSearchTerm('');
    setStatusFilter('Todos');
    if (document.getElementById('inscricoes')) {
      document.getElementById('inscricoes').value = '';
    }
    if (document.getElementById('notas')) {
      document.getElementById('notas').value = '';
    }
    setInscricoesFile(null);
    setNotasFile(null);
  };
  
  const fetchData = async (id) => {
      if (!id) return;
      try {
          const response = await axios.get(`http://localhost:5000/api/students/${id}`);
          setValidStudents(response.data.validos || []);
          setInconsistentData(response.data.inconsistentes || []);
          setMessage("Pré-visualização dos dados gerada. Clique em 'Baixar .XLSX' para obter o arquivo.");
      } catch (error) {
          console.error("Erro ao buscar dados:", error);
          setMessage(error.response?.data?.error || 'Erro ao buscar dados.');
          setValidStudents([]);
          setInconsistentData([]);
      }
  };

  const handleUpload = async () => {
    if (!inscricoesFile || !notasFile) {
      alert('Por favor, selecione os dois arquivos.');
      return;
    }
    setLoading(true);
    // Limpa os dados e mensagens anteriores
    setMessage('');
    setRequestId(null);
    setValidStudents([]);
    setInconsistentData([]);


    const formData = new FormData();
    formData.append('inscricoes', inscricoesFile);
    formData.append('notas', notasFile);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newRequestId = response.data.requestId;
      if (newRequestId) {
        setRequestId(newRequestId);
        fetchData(newRequestId); 
      } else {
        setMessage(response.data.message || "Ocorreu um erro, ID da requisição não retornado.");
      }

    } catch (error) {
      setMessage(error.response?.data?.error || 'Erro no upload');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadClick = () => {
    setTimeout(clearData, 2000); // Atraso para garantir que o download inicie
  };


  const filteredStudents = useMemo(() => {
      return (validStudents || [])
          .filter(student => 
              (student.nome_completo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
              (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
          )
          .filter(student => 
              statusFilter === 'Todos' || student.situacao === statusFilter
          );
  }, [searchTerm, statusFilter, validStudents]);
  
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Header><h1>AGSUS - Unificador de Dados</h1></Header>

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
          <UploadButton onClick={handleUpload} disabled={loading || !inscricoesFile || !notasFile}>
            {loading ? 'Processando...' : 'Processar e Visualizar Dados'}
          </UploadButton>
          {message && <p>{message}</p>}
        </UploadSection>
        
        {/* CORREÇÃO: Renderiza a seção de visualização se houver um ID de requisição, mesmo que as listas estejam vazias */}
        {requestId && (
          <>
            <h2>2. Pré-visualização dos Dados</h2>
            <TabContainer>
                <TabButton onClick={() => setActiveTab('validos')} $active={activeTab === 'validos'}>
                    Alunos Válidos ({filteredStudents.length})
                </TabButton>
                <TabButton onClick={() => setActiveTab('inconsistentes')} $active={activeTab === 'inconsistentes'}>
                    Dados Inconsistentes ({inconsistentData.length})
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
                        <DownloadButton 
                          href={`http://localhost:5000/api/download/${requestId}`}
                          target="_blank"
                          download
                          onClick={handleDownloadClick}
                        >
                            Baixar .XLSX e Limpar
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
                          {filteredStudents.length > 0 ? (
                            filteredStudents.map((student, index) => (
                                <tr key={student.email || index}>
                                    <td>{student.identificador}</td><td>{student.nome_completo}</td><td>{student.email}</td>
                                    <td>{student.situacao}</td><td>{student.nota}</td><td>{student.produto}</td><td>{student.pedido}</td>
                                    <td>{student.nascimento}</td><td>{student.genero}</td><td>{student.profissao}</td>
                                    <td>{student.estado}</td><td>{student.concluido}</td>
                                </tr>
                            ))
                          ) : (
                            <tr><td colSpan="12">Nenhum aluno válido encontrado com os filtros atuais.</td></tr>
                          )}
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
                          {inconsistentData.length > 0 ? (
                            inconsistentData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.motivo_inconsistencia}</td>
                                    <td>{item.dados_originais}</td>
                                </tr>
                            ))
                          ) : (
                            <tr><td colSpan="2">Nenhum dado inconsistente encontrado.</td></tr>
                          )}
                        </tbody>
                    </table>
                </TableContainer>
            )}
          </>
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;