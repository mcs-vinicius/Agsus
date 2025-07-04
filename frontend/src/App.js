import React, { useState, useMemo } from 'react';
import axios from 'axios';
import styled, { createGlobalStyle, ThemeProvider, keyframes } from 'styled-components';
import { theme } from './theme';

// --- Animações ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 8px ${props => props.theme.shadows.glowAccent}, 0 0 12px ${props => props.theme.shadows.glowAccent}; }
  50% { box-shadow: 0 0 20px ${props => props.theme.shadows.glowAccent}, 0 0 30px ${props => props.theme.shadows.glowAccent}; }
  100% { box-shadow: 0 0 8px ${props => props.theme.shadows.glowAccent}, 0 0 12px ${props => props.theme.shadows.glowAccent}; }
`;

const moveBackground = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// --- Estilos Globais e Contêineres ---

const GlobalStyle = createGlobalStyle`
  body {
    background: linear-gradient(135deg, #090a0f, #1b2735, #0d0d2b, #1b2735, #090a0f);
    background-size: 500% 500%;
    color: ${props => props.theme.colors.text};
    font-family: 'Share Tech Mono', monospace;
    margin: 0;
    padding: 20px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    animation: ${moveBackground} 20s ease-in-out infinite;
  }

  * {
    box-sizing: border-box;
    text-shadow: ${props => props.theme.shadows.textGlow};
  }
`;

const AppContainer = styled.div`
  max-width: 1600px;
  margin: auto;
  animation: ${fadeIn} 1s ease-in-out;
`;

const Header = styled.header`
  background: rgba(26, 26, 58, 0.5);
  backdrop-filter: blur(5px);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 40px;
  border: 1px solid ${props => props.theme.colors.secondary};
  box-shadow: ${props => props.theme.shadows.glowPrimary};
  animation: ${fadeIn} 0.8s ease-out;

  h1 {
    margin: 0;
    color: ${props => props.theme.colors.white};
    font-family: 'Orbitron', sans-serif;
    font-size: 2.8em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 4px;
    text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px ${props => props.theme.colors.secondary}, 0 0 20px ${props => props.theme.colors.secondary};
  }
`;

const Section = styled.section`
    background: rgba(26, 26, 58, 0.4);
    backdrop-filter: blur(5px);
    padding: 30px;
    border-radius: 8px;
    margin-bottom: 30px;
    border: 1px solid ${props => props.theme.colors.darkBlue};
    box-shadow: inset 0 0 15px rgba(0, 245, 212, 0.1);
    animation: ${fadeIn} 1s ease-out;
    animation-fill-mode: both;

    h2 {
      font-family: 'Orbitron', sans-serif;
      color: ${props => props.theme.colors.secondary};
      margin-top: 0;
      border-bottom: 1px solid ${props => props.theme.colors.darkBlue};
      padding-bottom: 15px;
    }
`;

// --- Componentes de Upload Dinâmicos ---

const UploadGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  margin-bottom: auto;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const HiddenInput = styled.input.attrs({ type: 'file' })`
  width: 0.1px;
	height: 0.1px;
	opacity: 0;
	overflow: hidden;
	position: absolute;
	z-index: -1;
`;

const FileInputLabel = styled.label`
  padding: 12px 20px;
  background-color: ${props => (props.$hasFile ? props.theme.colors.success : props.theme.colors.primary)};
  color: ${props => (props.$hasFile ? props.theme.colors.dark : props.theme.colors.white)};
  border: 1px solid ${props => (props.$hasFile ? props.theme.colors.success : props.theme.colors.secondary)};
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: ${props => (props.$hasFile ? props.theme.shadows.glowSuccess : 'none')};
  display: block;
  text-align: center;
  margin: auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.glowAccent};
  }
`;

const FileName = styled.span`
  display: block;
  margin-top: 8px;
  font-style: italic;
  font-size: 0.9em;
  text-align: center;
  color: ${props => (props.$hasFile ? props.theme.colors.success : props.theme.colors.text)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const UploadButton = styled.button`
  padding: 15px 30px;
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.white};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Orbitron', sans-serif;
  font-weight: bold;
  font-size: 1.1em;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  transition: all 0.3s ease;
  display: block;
  margin: 20px auto 0;

  &:disabled {
    background-color: #555;
    box-shadow: none;
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  &:not(:disabled) {
    animation: ${pulse} 2.5s infinite;
  }

  &:hover:not(:disabled) {
    transform: scale(1.05);
    background-color: #ff33ff;
    animation: none;
  }
`;

// Componente Wrapper para o input de arquivo
const FileInput = ({ id, accept, onChange, file, labelText, fileName }) => (
    <div>
        <HiddenInput id={id} accept={accept} onChange={onChange} />
        <FileInputLabel htmlFor={id} $hasFile={!!file}>
            {labelText}
        </FileInputLabel>
        <FileName $hasFile={!!file} title={fileName}>
            {fileName || "Nenhum arquivo"}
        </FileName>
    </div>
);

// --- Barra de Ferramentas e Tabela ---

const Toolbar = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
    align-items: center;
    padding: 20px;
    background-color: rgba(9,10,15,0.6);
    border-radius: 8px;
`;

const SearchInput = styled.input`
    padding: 10px;
    border-radius: 5px;
    border: 1px solid ${props => props.theme.colors.secondary};
    background-color: ${props => props.theme.colors.darkBlue};
    color: ${props => props.theme.colors.text};
    width: 300px;
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        box-shadow: ${props => props.theme.shadows.glowAccent};
        border-color: ${props => props.theme.colors.accent};
    }
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
    transition: all 0.3s ease;
    box-shadow: ${props => props.theme.shadows.glowSuccess};
    margin-left: auto;

    &.disabled {
        background-color: #555;
        box-shadow: none;
        cursor: not-allowed;
        pointer-events: none;
    }

    &:hover:not(.disabled) {
        transform: scale(1.05);
        box-shadow: 0 0 20px ${props => props.theme.shadows.glowSuccess};
    }
`;

const TableContainer = styled.div`
    overflow-x: auto;
    
    table {
        width: 100%;
        border-collapse: collapse;

        th, td {
            padding: 15px;
            border-bottom: 1px solid ${props => props.theme.colors.darkBlue};
            text-align: left;
            white-space: nowrap;
        }

        th {
            background-color: ${props => props.theme.colors.primary};
            color: ${props => props.theme.colors.secondary};
            text-transform: uppercase;
            font-family: 'Orbitron', sans-serif;
        }

        tbody tr {
            transition: all 0.2s ease-in-out;
        }

        tbody tr:nth-child(even) {
            background-color: rgba(26, 26, 58, 0.2);
        }

        tbody tr:hover {
          background-color: ${props => props.theme.colors.darkBlue};
          transform: scale(1.005);
          box-shadow: 0 0 20px rgba(0, 245, 212, 0.5);
          z-index: 10;
          position: relative;
        }
    }
`;

const TabContainer = styled.div`
    display: flex;
    margin-bottom: -1px;
    position: relative;
    z-index: 5;
`;

const TabButton = styled.button`
    padding: 15px 25px;
    cursor: pointer;
    border: 1px solid ${props => props.$active ? props.theme.colors.secondary : 'transparent'};
    border-bottom: none;
    background: ${props => props.$active ? 'rgba(26, 26, 58, 0.4)' : 'rgba(13, 13, 43, 0.5)'};
    color: ${props => props.$active ? props.theme.colors.secondary : props.theme.colors.text};
    border-radius: 8px 8px 0 0;
    font-weight: bold;
    transition: all 0.3s ease;
    font-family: 'Orbitron', sans-serif;
    
    &:hover {
        background: rgba(26, 26, 58, 0.6);
        color: ${props => props.theme.colors.secondary};
    }
`;

// --- Componente Principal ---

function App() {
  const [inscricoesFile, setInscricoesFile] = useState(null);
  const [notasFile, setNotasFile] = useState(null);
  const [progressoFile, setProgressoFile] = useState(null);
  const [inscricoesFileName, setInscricoesFileName] = useState('');
  const [notasFileName, setNotasFileName] = useState('');
  const [progressoFileName, setProgressoFileName] = useState('');

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

  const handleFileChange = (e, setFile, setFileName) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setFileName(file.name);
    }
  };

  const clearData = () => {
    setValidStudents([]);
    setInscricoesError([]);
    setNotasError([]);
    setProgressoError([]);
    setMessage('');
    setRequestId(null);
    setSearchTerm('');
    setStatusFilter('Todos');
    setInscricoesFile(null);
    setNotasFile(null);
    setProgressoFile(null);
    setInscricoesFileName('');
    setNotasFileName('');
    setProgressoFileName('');
  };

  const fetchData = async (id) => {
    if (!id) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${id}`);
      // Adicionado para depuração
      console.log("Dados recebidos do backend:", response.data); 
      setValidStudents(response.data.validos || []);
      setInscricoesError(response.data.inscricoes_error || []);
      setNotasError(response.data.notas_error || []);
      setProgressoError(response.data.progresso_error || []);
      setMessage("Pré-visualização dos dados gerada. Clique em 'Extrair em Exel' para obter o arquivo.");
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
        await fetchData(newRequestId); // Garante que os dados são buscados antes de continuar
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
    setTimeout(clearData, 2000);
  };

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(validStudents)) {
      return [];
    }

    return validStudents.filter(student => {
      const statusMatch = statusFilter === 'Todos' || student.situacao === statusFilter;
      const term = searchTerm.toLowerCase();
      const nameMatch = student.nome_completo?.toLowerCase().includes(term);
      const emailMatch = student.email?.toLowerCase().includes(term);
      const searchMatch = term === '' || nameMatch || emailMatch;
      
      return statusMatch && searchMatch;
    });
  }, [searchTerm, statusFilter, validStudents]);
  
  const renderTable = (data, headers, noDataMessage) => {
    const tableHeaders = headers && headers.length > 0 ? headers : (data && data.length > 0 ? Object.keys(data[0]) : []);
    const colSpan = tableHeaders.length || 1;
  
    return (
      <TableContainer>
        <table>
          <thead>
            <tr>
              {tableHeaders.map(header => (
                <th key={header}>
                  {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index}>
                  {tableHeaders.map(header => (
                    <td key={header}>
                      {item[header] ?? ''}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={colSpan}>{noDataMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Header><h1>AGSUS - Unificador de Dados</h1></Header>

        <Section>
          <h2>1. Faça o Upload dos Arquivos (.CSV)</h2>
          <UploadGrid>
              <FileInput 
                  id="inscricoes" 
                  accept=".csv" 
                  onChange={e => handleFileChange(e, setInscricoesFile, setInscricoesFileName)} 
                  file={inscricoesFile}
                  fileName={inscricoesFileName}
                  labelText="Inscrições"
              />
              <FileInput 
                  id="notas" 
                  accept=".csv" 
                  onChange={e => handleFileChange(e, setNotasFile, setNotasFileName)} 
                  file={notasFile}
                  fileName={notasFileName}
                  labelText="Notas"
              />
              <FileInput 
                  id="progresso" 
                  accept=".csv" 
                  onChange={e => handleFileChange(e, setProgressoFile, setProgressoFileName)} 
                  file={progressoFile}
                  fileName={progressoFileName}
                  labelText="Progresso"
              />
          </UploadGrid>
          <UploadButton onClick={handleUpload} disabled={loading || !inscricoesFile || !notasFile || !progressoFile}>
            {loading ? 'Processando...' : 'Processar e Visualizar'}
          </UploadButton>
          {message && <p>{message}</p>}
        </Section>

        {requestId && (
          <Section>
            <h2>2. Pré-visualização dos Dados</h2>
            <TabContainer>
              <TabButton onClick={() => setActiveTab('validos')} $active={activeTab === 'validos'}>
                Válidos ({filteredStudents.length})
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
              <DownloadButton
                    href={`http://localhost:5000/api/download/${requestId}`}
                    target="_blank"
                    download
                    onClick={handleDownloadClick}
                  >
                    Extrair em Excel
                  </DownloadButton>
            </TabContainer>

            {activeTab === 'validos' && (
              <>
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
                  
                </Toolbar>
                {renderTable(
                  filteredStudents,
                  ["identificador", "pedido", "produto", "nome_completo", "nascimento", "genero", "email", "profissao", "especialidade", "vinculo", "cidade", "estado", "concluido", "nota", "progresso", "situacao"],
                  "Nenhum aluno válido encontrado com os filtros atuais."
                )}
              </>
            )}
            
            {activeTab === 'inscricoes_error' && renderTable(inscricoesError, inscricoesError.length > 0 ? Object.keys(inscricoesError[0]) : [], "Nenhum erro encontrado nas inscrições.")}
            {activeTab === 'notas_error' && renderTable(notasError, notasError.length > 0 ? Object.keys(notasError[0]) : [], "Nenhum erro encontrado nas notas.")}
            {activeTab === 'progresso_error' && renderTable(progressoError, progressoError.length > 0 ? Object.keys(progressoError[0]) : [], "Nenhum erro encontrado no progresso.")}
          </Section>
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;