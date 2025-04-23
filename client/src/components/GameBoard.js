import React from 'react';
import styled from 'styled-components';

const BoardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
`;

const Card = styled.div`
  position: relative;
  height: 100px;
  background-color: ${props => {
    if (props.flippedTeam === 'red') return '#f8d7da';
    if (props.flippedTeam === 'blue') return '#d1ecf1';
    return props.team === 'red' ? '#ffebee' : '#e3f2fd';
  }};
  border: 2px solid ${props => {
    if (props.flippedTeam === 'red') return '#e53935';
    if (props.flippedTeam === 'blue') return '#1e88e5';
    return props.team === 'red' ? '#ffcdd2' : '#bbdefb';
  }};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    height: 80px;
  }
`;

const CardText = styled.span`
  font-size: 1.5rem;
  font-weight: 500;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const CardInfo = styled.div`
  position: absolute;
  bottom: 5px;
  left: 5px;
  right: 5px;
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: ${props => props.team === 'red' ? '#e53935' : '#1e88e5'};
`;

function GameBoard({ cards }) {
  if (!cards || cards.length === 0) {
    return (
      <BoardContainer>
        <div>카드를 로딩 중입니다...</div>
      </BoardContainer>
    );
  }

  return (
    <BoardContainer>
      {cards.map((card) => (
        <Card 
          key={card.id} 
          team={card.team} 
          flippedTeam={card.flippedTeam}
        >
          <CardText>{card.word}</CardText>
          
          {card.flippedBy && (
            <CardInfo team={card.flippedTeam}>
              <span>{card.flippedTeam === 'red' ? '빨강' : '파랑'}</span>
              <span>{card.flippedBy.nickname}</span>
            </CardInfo>
          )}
        </Card>
      ))}
    </BoardContainer>
  );
}

export default GameBoard; 