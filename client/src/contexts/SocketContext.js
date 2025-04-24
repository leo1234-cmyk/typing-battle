import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(() => {
    // 로컬 스토리지에서 사용자 정보 복구
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // 소켓 초기화
  useEffect(() => {
    // 개발 환경과 배포 환경을 자동으로 처리
    const newSocket = process.env.NODE_ENV === 'production'
      ? io() // 프로덕션에서는 같은 도메인 사용
      : io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3002'); // 개발 환경에서는 별도 서버 사용
    
    newSocket.on('connect', () => {
      console.log('소켓 연결됨');
      setConnected(true);
      
      // 연결 시 저장된, 유저 정보가 있으면 로비 재참여
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData && userData.nickname) {
          console.log('연결 복구, 닉네임으로 로비 재참여:', userData.nickname);
          newSocket.emit('join-lobby', userData.nickname);
        }
      }
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
  
  // 사용자 정보 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);
  
  // 로비 입장
  const joinLobby = useCallback((nickname) => {
    if (socket && connected) {
      console.log(`Joining lobby with nickname: ${nickname}`);
      socket.emit('join-lobby', nickname);
      
      // 이벤트 리스너 등록
      const lobbyJoinedHandler = (userData) => {
        console.log('Lobby joined with user data:', userData);
        const userInfo = {
          id: userData.id,
          nickname: userData.nickname
        };
        setUser(userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
      };
      
      // 이미 등록된 리스너 제거
      socket.off('lobby-joined');
      // 새 리스너 등록
      socket.on('lobby-joined', lobbyJoinedHandler);
    }
  }, [socket, connected]);
  
  // 방 생성
  const createRoom = useCallback((options = {}) => {
    if (socket && connected) {
      socket.emit('create-room', options);
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
  
  // 로그아웃
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);
  
  // 공용 context 값
  const value = {
    socket,
    connected,
    user,
    joinLobby,
    createRoom,
    joinRoom,
    typeWord,
    logout
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 