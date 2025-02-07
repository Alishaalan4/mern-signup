import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/api/users/logout', {
        withCredentials: true
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Dashboard
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleLogout}
          
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default Dashboard; 