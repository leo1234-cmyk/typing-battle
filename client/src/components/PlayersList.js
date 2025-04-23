import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 250px;
  margin-right: 20px;
  
  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 20px;
    min-width: auto;
    width: 100%;
  }
`;

const TeamContainer = styled.div`
  margin-bottom: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
`;

const TeamHeader = styled.h3`
  font-size: 1.2rem;
  color: ${props => props.team === 'red' ? '#e53935' : '#1e88e5'};
  margin: 0 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid ${props => props.team === 'red' ? '#ffcdd2' : '#bbdefb'};
`;

const PlayersList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const PlayerItem = styled.li`
  display: flex;
  align-items: center;
  padding: 8px 0;
  
  ${props => props.isCurrentUser && `
    font-weight: bold;
    background-color: ${props.team === 'red' ? '#fff8f8' : '#f8fbff'};
    padding: 8px;
    margin: 0 -8px;
    border-radius: 4px;
  `}
`;

const PlayerAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: ${props => props.team === 'red' ? '#e53935' : '#1e88e5'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 10px;
`;

const PlayerName = styled.span`
  color: #333;
`;

function PlayersListComponent({ redTeam, blueTeam, currentUser }) {
  // 플레이어 초기글자 가져오기
  const getInitial = (nickname) => {
    return nickname ? nickname.charAt(0).toUpperCase() : '?';
  };

  // 현재 플레이어 체크
  const isCurrentUser = (player) => {
    return currentUser && player.id === currentUser.id;
  };

  return (
    <Container>
      <TeamContainer>
        <TeamHeader team="red">빨강팀 ({redTeam.length}/5)</TeamHeader>
        <PlayersList>
          {redTeam.map((player) => (
            <PlayerItem key={player.id} isCurrentUser={isCurrentUser(player)} team="red">
              <PlayerAvatar team="red">{getInitial(player.nickname)}</PlayerAvatar>
              <PlayerName>{player.nickname} {isCurrentUser(player) ? '(나)' : ''}</PlayerName>
            </PlayerItem>
          ))}
          {redTeam.length < 5 && Array(5 - redTeam.length).fill().map((_, index) => (
            <PlayerItem key={`empty-red-${index}`}>
              <PlayerAvatar team="red" style={{ opacity: 0.3 }}>?</PlayerAvatar>
              <PlayerName style={{ color: '#aaa' }}>대기 중...</PlayerName>
            </PlayerItem>
          ))}
        </PlayersList>
      </TeamContainer>

      <TeamContainer>
        <TeamHeader team="blue">파랑팀 ({blueTeam.length}/5)</TeamHeader>
        <PlayersList>
          {blueTeam.map((player) => (
            <PlayerItem key={player.id} isCurrentUser={isCurrentUser(player)} team="blue">
              <PlayerAvatar team="blue">{getInitial(player.nickname)}</PlayerAvatar>
              <PlayerName>{player.nickname} {isCurrentUser(player) ? '(나)' : ''}</PlayerName>
            </PlayerItem>
          ))}
          {blueTeam.length < 5 && Array(5 - blueTeam.length).fill().map((_, index) => (
            <PlayerItem key={`empty-blue-${index}`}>
              <PlayerAvatar team="blue" style={{ opacity: 0.3 }}>?</PlayerAvatar>
              <PlayerName style={{ color: '#aaa' }}>대기 중...</PlayerName>
            </PlayerItem>
          ))}
        </PlayersList>
      </TeamContainer>
    </Container>
  );
}

export default PlayersListComponent; 