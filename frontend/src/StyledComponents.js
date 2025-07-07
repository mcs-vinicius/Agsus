// frontend/src/StyledComponents.js

import styled, { createGlobalStyle, keyframes } from 'styled-components';

// --- Animações ---

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const pulse = keyframes`
  0% { box-shadow: 0 0 8px ${props => props.theme.shadows.glowAccent}, 0 0 12px ${props => props.theme.shadows.glowAccent}; }
  50% { box-shadow: 0 0 20px ${props => props.theme.shadows.glowAccent}, 0 0 30px ${props => props.theme.shadows.glowAccent}; }
  100% { box-shadow: 0 0 8px ${props => props.theme.shadows.glowAccent}, 0 0 12px ${props => props.theme.shadows.glowAccent}; }
`;

export const moveBackground = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// --- Estilos Globais e Contêineres ---

export const GlobalStyle = createGlobalStyle`
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

export const AppContainer = styled.div`
  max-width: 1600px;
  margin: auto;
  animation: ${fadeIn} 1s ease-in-out;
`;

export const Header = styled.header`
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

export const Section = styled.section`
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

export const UploadGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  margin-bottom: auto;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const HiddenInput = styled.input.attrs({ type: 'file' })`
  width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
`;

export const FileInputLabel = styled.label`
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

export const FileName = styled.span`
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

export const UploadButton = styled.button`
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

// --- Barra de Ferramentas e Tabela ---

export const Toolbar = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
    align-items: center;
    padding: 20px;
    background-color: rgba(9,10,15,0.6);
    border-radius: 8px;
`;

export const SearchInput = styled.input`
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

export const FilterSelect = styled.select`
    padding: 10px;
    border-radius: 5px;
    border: 1px solid ${props => props.theme.colors.secondary};
    background-color: ${props => props.theme.colors.darkBlue};
    color: ${props => props.theme.colors.text};
`;

export const DownloadButton = styled.a`
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

export const TableContainer = styled.div`
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

export const TabContainer = styled.div`
    display: flex;
    margin-bottom: -1px;
    position: relative;
    z-index: 5;
`;

export const TabButton = styled.button`
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