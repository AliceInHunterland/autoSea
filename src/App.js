import React from 'react';
import Container from '@material-ui/core/Container';

import FadeIn from 'react-fade-in';

import Demo from './Demo';



function App() {
  return (
    <Container maxWidth="md">
      <FadeIn>
        <div id="demo" />
          <div class="row justify-content-between">
              <div class="col">
                  <h5 class="text-center">Original</h5>
                  <img src="./images/salazar-snake.png" id="input-image" class="input-image img-fluid rounded mx-auto d-block" alt="Input image"></img>
              </div>
              <div class="col align-self-center">
                  <h5 class="text-center">Canvas scaled</h5>
                  <img src="./images/salazar-snake.png" id="canvas-image" class="input-image img-fluid rounded mx-auto d-block" alt="Input image"></img>
              </div>
              <div id="target" class="col-3 align-self-center"></div>
          </div>

        <Demo />
      </FadeIn>
    </Container>
  );
}

export default App;
