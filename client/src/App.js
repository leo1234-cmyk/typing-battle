import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { SocketProvider } from './contexts/SocketContext';
import NicknameScreen from './screens/NicknameScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameRoomScreen from './screens/GameRoomScreen';

const AppContainer = styled.div`
  max-width: 1200px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin: 0;
`;

function App() {
  return (
    <SocketProvider>
      <AppContainer>
        <Header>
          <Title>타자 판치기</Title>
        </Header>
        
        <Routes>
          <Route path="/" element={<NicknameScreen />} />
          <Route path="/lobby" element={<LobbyScreen />} />
          <Route path="/room/:roomId" element={<GameRoomScreen />} />
        </Routes>
      </AppContainer>
    </SocketProvider>
  );
}

export default App; 