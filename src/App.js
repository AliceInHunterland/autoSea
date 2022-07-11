import React from 'react';
import Container from '@material-ui/core/Container';

import FadeIn from 'react-fade-in';

import Demo from './Demo';



function App() {
  return (
    <Container maxWidth="md">
      <FadeIn>

        <div id="demo" />


        <Demo />
      </FadeIn>
    </Container>
  );
}

export default App;
