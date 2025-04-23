import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const WelcomeText = styled.p`
  font-size: 1.2rem;
  margin-bottom: 30px;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const CreateRoomButton = styled.button`
  padding: 12px 24px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #43a047;
  }
`;

const RoomsContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const RoomsTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
`;

const RoomsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const RoomCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const RoomInfo = styled.div`
  margin-bottom: 15px;
`;

const RoomId = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
`;

const PlayerCount = styled.p`
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 15px;
`;

const JoinButton = styled.button`
  padding: 10px 15px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  margin-top: auto;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #3a7bc8;
  }
`;

const NoRoomsMessage = styled.p`
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  margin: 40px 0;
`;

function LobbyScreen() {
  const [rooms, setRooms] = useState([]);
  const { socket, createRoom, joinRoom, user } = useSocket();
  const navigate = useNavigate();
  
  // 사용자가 로그인하지 않은 경우 닉네임 화면으로 리다이렉트
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // 이용 가능한 방 목록 수신
  useEffect(() => {
    if (socket) {
      socket.on('available-rooms', (roomsList) => {
        setRooms(roomsList);
      });
      
      // 방 생성 완료 이벤트
      socket.on('room-created', ({ roomId }) => {
        joinRoom(roomId);
      });
      
      // 방 입장 완료 이벤트
      socket.on('room-joined', ({ roomId }) => {
        navigate(`/room/${roomId}`);
      });
      
      // 에러 메시지
      socket.on('join-error', (errorMessage) => {
        alert(errorMessage);
      });
      
      return () => {
        socket.off('available-rooms');
        socket.off('room-created');
        socket.off('room-joined');
        socket.off('join-error');
      };
    }
  }, [socket, navigate, joinRoom]);
  
  const handleCreateRoom = () => {
    createRoom();
  };
  
  const handleJoinRoom = (roomId) => {
    joinRoom(roomId);
  };
  
  return (
    <Container>
      {user && (
        <WelcomeText>
          안녕하세요, <strong>{user.nickname}</strong>님! 게임방을 생성하거나 참여해보세요.
        </WelcomeText>
      )}
      
      <ButtonContainer>
        <CreateRoomButton onClick={handleCreateRoom}>
          새 게임방 만들기
        </CreateRoomButton>
      </ButtonContainer>
      
      <RoomsContainer>
        <RoomsTitle>참여 가능한 게임방</RoomsTitle>
        
        {rooms.length > 0 ? (
          <RoomsList>
            {rooms.map((room) => (
              <RoomCard key={room.id}>
                <RoomInfo>
                  <RoomId>방 ID: {room.id}</RoomId>
                  <PlayerCount>
                    참가자: {room.players}/{room.maxPlayers}명
                  </PlayerCount>
                </RoomInfo>
                <JoinButton onClick={() => handleJoinRoom(room.id)}>
                  참여하기
                </JoinButton>
              </RoomCard>
            ))}
          </RoomsList>
        ) : (
          <NoRoomsMessage>
            현재 이용 가능한 게임방이 없습니다. 새 게임방을 만들어보세요!
          </NoRoomsMessage>
        )}
      </RoomsContainer>
    </Container>
  );
}

export default LobbyScreen; 