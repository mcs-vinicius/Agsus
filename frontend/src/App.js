// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from './theme';

// CORREÇÃO AQUI 👇
import { GlobalStyle, AppContainer, Header } from './StyledComponents.js';

// Importando as novas telas
import UploadScreen from './components/UploadScreen';
import AlunosScreen from './components/AlunosScreen';


// Novo componente de Navegação
const Nav = styled.nav`
  padding: 10px 20px;
  background: rgba(13, 13, 43, 0.7);
  border-radius: 8px;
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
  gap: 30px;
  border: 1px solid ${props => props.theme.colors.darkBlue};
  box-shadow: ${props => props.theme.shadows.glowPrimary};

  a {
    color: white;
    text-decoration: none;
    font-size: 1.2em;
    font-family: 'Orbitron', sans-serif;
    padding: 10px 20px;
    border-radius: 5px;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;

    &:hover, &.active {
      background-color: ${props => props.theme.colors.accent};
      color: white;
      text-shadow: 0 0 10px ${props => props.theme.colors.accent};
    }
  }
`;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <AppContainer>
          <Header><h1>AGSUS - Unificador de Dados</h1></Header>
          
          <Nav>
            <Link to="/">Upload de Arquivos</Link>
            <Link to="/alunos">Gerenciar Alunos</Link>
          </Nav>

          <Routes>
            <Route path="/" element={<UploadScreen />} />
            <Route path="/alunos" element={<AlunosScreen />} />
          </Routes>
          
        </AppContainer>
      </Router>
    </ThemeProvider>
  );
}

export default App;