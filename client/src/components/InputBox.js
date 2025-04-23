import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-top: 20px;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  width: 100%;
`;

const Input = styled.input`
  flex: 1;
  padding: 15px;
  font-size: 1.1rem;
  border: 2px solid ${props => props.isGameActive ? '#4a90e2' : '#ccc'};
  border-radius: 8px;
  transition: all 0.3s;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
  }
  
  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const MessageText = styled.p`
  margin-top: 10px;
  color: #666;
  font-size: 0.9rem;
  text-align: center;
`;

function InputBox({ onSubmit, isGameActive }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  
  // 게임이 시작되면 입력창에 포커스
  useEffect(() => {
    if (isGameActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isGameActive]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (inputValue.trim() && isGameActive) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };
  
  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isGameActive ? "단어를 입력하세요" : "게임이 시작되면 단어를 입력할 수 있습니다"}
          disabled={!isGameActive}
          isGameActive={isGameActive}
          autoComplete="off"
        />
      </Form>
      
      {isGameActive ? (
        <MessageText>
          카드에 적힌 단어를 정확하게 입력하면 카드를 뒤집을 수 있습니다.
        </MessageText>
      ) : (
        <MessageText>
          게임이 시작되면 단어를 입력할 수 있습니다.
        </MessageText>
      )}
    </Container>
  );
}

export default InputBox; 