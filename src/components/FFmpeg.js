import React, { useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
// import { InferenceSession, Tensor } from 'onnxruntime-web';
// const ort = require('onnxruntime-react-native');
// import onLoadImage from './ImagePrediction';
import handleImage, {getImageTensorFromPath} from './ImagePrediction';
import {data as classes} from "./imagenet_classes.json";

import fs from "fs";
import { InferenceSession, Tensor } from "onnxruntime-web";


// import {
//   warmupModel,
//   getTensorFromCanvasContext,
//   setContextFromTensor,
//   tensorToCanvas,
//   canvasToTensor
// } from "./onnx/utils";

let inferenceSession;

const MODEL_URL = "./model.onnx";
const IMAGE_SIZE = 250;

let ffmpeg = null;


const useStyles = makeStyles({
  root: {
    margin: '48px 0px 48px 0px',
  },
  progress: {
    width: '100%',
  },
});

const readFromBlobOrFile = (blob) => (
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = ({ target: { error: { code } } }) => {
      reject(Error(`File could not be read! Code=${code}`));
    };
    fileReader.readAsArrayBuffer(blob);
  })
);

function CircularProgressWithLabel(props) {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="static" {...props} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="caption" component="div" color="textSecondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

function FFmpeg({ args, inFilename, outFilename, mediaType }) {
  const classes = useStyles();
  const [videoSrc, setVideoSrc] = useState('');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (ffmpeg === null) {
      ffmpeg = createFFmpeg({
        log: true,
        corePath: './static/js/ffmpeg-core.js',
        // corePath: 'https://unpkg.com/@ffmpeg/core@0.8.3/dist/ffmpeg-core.js',
      });
    }
    ffmpeg.setLogger(({ type, message }) => {
      if (type !== 'info') {
        setMessage(message);
      }
    });
    ffmpeg.setProgress(({ ratio }) => {
      if (ratio >= 0 && ratio <= 1) {
        setProgress(ratio * 100);
      }
      if (ratio === 1) {
        setTimeout(() => { setProgress(0); }, 1000);
      }
    });
  });



  const onFileUploaded = async ({ target: { files } }) => {
    const file = new Uint8Array(await readFromBlobOrFile(files[0]));
    var today = Math.round((new Date()).getTime() / 1000);
    var dirName = files[0]['name'].replace('.', '_') + '_' + today.toString();

    setMessage('Loading FFmpeg.wasm');
    if (!ffmpeg.isLoaded()) {
      setMessage('Loading ffmpeg.wasm-core, may take few minutes');
      await ffmpeg.load();
    }
    ffmpeg.FS('writeFile', files[0]['name'], await fetchFile(file));
    setMessage('Start to run command');
    const start = Date.now();
    await ffmpeg.FS("mkdir", dirName);
    var videoName = files[0]['name'];
    await ffmpeg.run('-i', videoName, '-vf', 'crop=in_w:in_h-200,scale=960:-1', '-r', '1', dirName + '/%04d.png', '-fflags', 'discardcorrupt');



    const listDir1 = ffmpeg.FS("readdir", '.');
    console.log(listDir1);
    const listDir = ffmpeg.FS("readdir", dirName);
    console.log(listDir);


    const modelFile = `./static/js/my_classification.onnx`;
    console.log("loading onnx model");
    console.log(modelFile);


    const session = await InferenceSession.create(modelFile,{executionProviders: ['wasm']});

    for (let i = 2; i < listDir.length; i++) {


    const data = ffmpeg.FS('readFile', dirName + '/' + listDir[i]);


    setVideoSrc(URL.createObjectURL(new Blob([data.buffer], {type: 'image/png'})));

    // var fileReader = new FileReader();
    // fileReader.readAsDataURL(new Blob([data.buffer]));
    const myImg = document.getElementById('input-image');
    myImg.src = URL.createObjectURL(new Blob([data.buffer], {type: 'image/png'}));
    // myImg.onload = () => handleImage(myImg);
    var res = await handleImage(myImg,session);//WTF PROMISE???????
    // var res = run(myTensor);
    console.log('aaaaaaaaaaaaaaaaaa', res);
    console.log(res);


  };
    setMessage(`Done in ${Date.now() - start} ms`);

  };
  return (



    <Grid className={classes.root} container direction="column" alignItems="center" spacing={2}>
      {videoSrc.length === 0 ? null : (
        <Grid item>
          <img src={videoSrc} id="input-image"
               className="input-image img-fluid rounded mx-auto d-block" alt="Input image"></img>,
          < handleImage />


        </Grid>
      )}
      <Grid item>
        {progress !== 0 ? (
          <CircularProgressWithLabel
            variant="static"
            color="secondary"
            value={progress}
          />
        ) : (
          <Button
            variant="contained"
            component="label"
            color="secondary"
          >
            Upload a Video/Audio File
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={onFileUploaded}
            />
          </Button>
        )}
      </Grid>
      <Grid item>
        <Typography align="center">
          {`$ ffmpeg ${args.join(' ')}`}
        </Typography>
      </Grid>
      <Grid item>
        <Typography align="center">
          {message}
        </Typography>
      </Grid>
    </Grid>
  );
}

export default FFmpeg;
