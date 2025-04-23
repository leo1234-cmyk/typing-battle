import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Label = styled.label`
  font-size: 1.2rem;
  margin-bottom: 10px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 12px 15px;
  font-size: 1.1rem;
  border: 2px solid #ddd;
  border-radius: 5px;
  margin-bottom: 20px;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
  }
`;

const Button = styled.button`
  padding: 12px 20px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #3a7bc8;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const Description = styled.p`
  text-align: center;
  margin-bottom: 30px;
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
`;

function NicknameScreen() {
  const [nickname, setNickname] = useState('');
  const { joinLobby, user, connected } = useSocket();
  const navigate = useNavigate();
  
  // 닉네임 설정 후 로비로 이동
  useEffect(() => {
    if (user) {
      navigate('/lobby');
    }
  }, [user, navigate]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (nickname.trim() && connected) {
      joinLobby(nickname.trim());
    }
  };
  
  return (
    <Container>
      <Description>
        환영합니다! 타자 판치기는 5:5 팀 대항전 타자 게임입니다. <br/>
        게임에 참여하려면 닉네임을 입력해주세요.
      </Description>
      
      <Form onSubmit={handleSubmit}>
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요"
          minLength={2}
          maxLength={10}
          required
        />
        
        <Button type="submit" disabled={!nickname.trim() || !connected}>
          게임 시작하기
        </Button>
      </Form>
    </Container>
  );
}

export default NicknameScreen; 