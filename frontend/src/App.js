import React, { useState, useMemo } from 'react';
import axios from 'axios';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { theme } from './theme';

// --- Estilos (sem alterações) ---

const GlobalStyle = createGlobalStyle`
  body {
    background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
    color: ${props => props.theme.colors.text};
    font-family: 'Orbitron', sans-serif;
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
  max-width: 1600px;
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
            white-space: nowrap;
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
  const [progressoFile, setProgressoFile] = useState(null);
  const [validStudents, setValidStudents] = useState([]);
  const [inscricoesError, setInscricoesError] = useState([]);
  const [notasError, setNotasError] = useState([]);
  const [progressoError, setProgressoError] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [activeTab, setActiveTab] = useState('validos');

  const clearData = () => {
    setValidStudents([]);
    setInscricoesError([]);
    setNotasError([]);
    setProgressoError([]);
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
    if (document.getElementById('progresso')) {
      document.getElementById('progresso').value = '';
    }
    setInscricoesFile(null);
    setNotasFile(null);
    setProgressoFile(null);
  };

  const fetchData = async (id) => {
    if (!id) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${id}`);
      setValidStudents(response.data.validos || []);
      setInscricoesError(response.data.inscricoes_error || []);
      setNotasError(response.data.notas_error || []);
      setProgressoError(response.data.progresso_error || []);
      setMessage("Pré-visualização dos dados gerada. Clique em 'Baixar .XLSX' para obter o arquivo.");
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setMessage(error.response?.data?.error || 'Erro ao buscar dados.');
      setValidStudents([]);
      setInscricoesError([]);
      setNotasError([]);
      setProgressoError([]);
    }
  };

  const handleUpload = async () => {
    if (!inscricoesFile || !notasFile || !progressoFile) {
      alert('Por favor, selecione os três arquivos.');
      return;
    }
    setLoading(true);
    // Limpa os dados e mensagens anteriores
    setMessage('');
    setRequestId(null);
    setValidStudents([]);
    setInscricoesError([]);
    setNotasError([]);
    setProgressoError([]);

    const formData = new FormData();
    formData.append('inscricoes', inscricoesFile);
    formData.append('notas', notasFile);
    formData.append('progresso', progressoFile);


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
  
  const renderTable = (data, headers, noDataMessage, colSpan) => (
    <TableContainer>
      <table>
        <thead>
          <tr>
            {headers.map(header => <th key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={index}>
                {headers.map(header => <td key={header}>{item[header.toLowerCase().replace(/ /g, '_')] || JSON.stringify(item)}</td>)}
              </tr>
            ))
          ) : (
            <tr><td colSpan={colSpan}>{noDataMessage}</td></tr>
          )}
        </tbody>
      </table>
    </TableContainer>
  );


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
          <div>
            <FileInputLabel htmlFor="progresso">Arquivo de Progresso (.csv): </FileInputLabel>
            <input type="file" id="progresso" accept=".csv" onChange={e => setProgressoFile(e.target.files[0])} />
          </div>
          <UploadButton onClick={handleUpload} disabled={loading || !inscricoesFile || !notasFile || !progressoFile}>
            {loading ? 'Processando...' : 'Processar e Visualizar Dados'}
          </UploadButton>
          {message && <p>{message}</p>}
        </UploadSection>

        {requestId && (
          <>
            <h2>2. Pré-visualização dos Dados</h2>
            <TabContainer>
              <TabButton onClick={() => setActiveTab('validos')} $active={activeTab === 'validos'}>
                Alunos Válidos ({filteredStudents.length})
              </TabButton>
              <TabButton onClick={() => setActiveTab('inscricoes_error')} $active={activeTab === 'inscricoes_error'}>
                Erros Inscrições ({inscricoesError.length})
              </TabButton>
              <TabButton onClick={() => setActiveTab('notas_error')} $active={activeTab === 'notas_error'}>
                Erros Notas ({notasError.length})
              </TabButton>
              <TabButton onClick={() => setActiveTab('progresso_error')} $active={activeTab === 'progresso_error'}>
                Erros Progresso ({progressoError.length})
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
                {renderTable(
                  filteredStudents,
                  ["identificador", "pedido", "produto", "nome_completo", "nascimento", "genero", "email", "profissao", "especialidade", "vinculo", "cidade", "estado", "concluido", "nota", "progresso", "situacao"],
                  "Nenhum aluno válido encontrado com os filtros atuais.",
                  16
                )}
              </TableContainer>
            )}
            
            {activeTab === 'inscricoes_error' && renderTable(inscricoesError, Object.keys(inscricoesError[0] || {}), "Nenhum erro encontrado nas inscrições.", 2)}
            {activeTab === 'notas_error' && renderTable(notasError, Object.keys(notasError[0] || {}), "Nenhum erro encontrado nas notas.", 2)}
            {activeTab === 'progresso_error' && renderTable(progressoError, Object.keys(progressoError[0] || {}), "Nenhum erro encontrado no progresso.", 2)}
            
          </>
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;