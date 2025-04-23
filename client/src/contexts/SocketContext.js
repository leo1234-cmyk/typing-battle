import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  
  // 소켓 초기화
  useEffect(() => {
    // 개발 환경과 배포 환경을 자동으로 처리
    const newSocket = process.env.NODE_ENV === 'production'
      ? io() // 프로덕션에서는 같은 도메인 사용
      : io('http://localhost:3001'); // 개발 환경에서는 별도 서버 사용
    
    newSocket.on('connect', () => {
      console.log('소켓 연결됨');
      setConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      console.log('소켓 연결 끊김');
      setConnected(false);
    });
    
    setSocket(newSocket);
    
    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // 로비 입장
  const joinLobby = useCallback((nickname) => {
    if (socket && connected) {
      socket.emit('join-lobby', nickname);
      
      // 이벤트 리스너 등록 (한 번만)
      socket.once('lobby-joined', (userData) => {
        setUser({
          id: userData.id,
          nickname: userData.nickname
        });
      });
    }
  }, [socket, connected]);
  
  // 방 생성
  const createRoom = useCallback(() => {
    if (socket && connected) {
      socket.emit('create-room');
    }
  }, [socket, connected]);
  
  // 방 입장
  const joinRoom = useCallback((roomId) => {
    if (socket && connected) {
      socket.emit('join-room', roomId);
    }
  }, [socket, connected]);
  
  // 단어 타이핑
  const typeWord = useCallback((word) => {
    if (socket && connected) {
      socket.emit('type-word', { word });
    }
  }, [socket, connected]);
  
  // 공용 context 값
  const value = {
    socket,
    connected,
    user,
    joinLobby,
    createRoom,
    joinRoom,
    typeWord
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 