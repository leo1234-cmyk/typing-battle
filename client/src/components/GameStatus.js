import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }
`;

const Header = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #333;
`;

const TimerContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const TimerValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => {
    if (props.time <= 30) return '#e53935'; // 30초 이하면 빨간색
    if (props.time <= 60) return '#ff9800'; // 1분 이하면 주황색
    return '#4a90e2'; // 그 외에는 파란색
  }};
`;

const ScoreContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const TeamScore = styled.div`
  text-align: center;
  padding: 10px;
  border-radius: 5px;
  background-color: ${props => props.team === 'red' ? '#ffebee' : '#e3f2fd'};
  width: 45%;
`;

const TeamName = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: ${props => props.team === 'red' ? '#e53935' : '#1e88e5'};
`;

const Score = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.team === 'red' ? '#e53935' : '#1e88e5'};
`;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

function GameStatus({ timer, redTeam, blueTeam, redScore, blueScore }) {
  return (
    <Container>
      <Header>게임 현황</Header>
      
      <TimerContainer>
        <TimerValue time={timer}>{formatTime(timer)}</TimerValue>
      </TimerContainer>
      
      <ScoreContainer>
        <TeamScore team="red">
          <TeamName team="red">빨강팀</TeamName>
          <Score team="red">{redScore || 0}</Score>
        </TeamScore>
        
        <TeamScore team="blue">
          <TeamName team="blue">파랑팀</TeamName>
          <Score team="blue">{blueScore || 0}</Score>
        </TeamScore>
      </ScoreContainer>
    </Container>
  );
}

export default GameStatus; 