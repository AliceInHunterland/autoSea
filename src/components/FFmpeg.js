import React, {useEffect, useState} from 'react';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
import * as ExcelJS from "exceljs";
import handleImage from './ImagePrediction';

import {saveAs} from "file-saver";


let ffmpeg = null;
const temp = {
    'Time':'0',
    'Anthozoa':'0',
    'Ascidia':'0',
    'Ascophyllum':'0',
    'Asterias':'0',
    'Balanus':'0',
    'Branchiomma':'0',
    'Buccinum':'0',
    'Caridea':'0',
    'Chionoecetes':'0',
    'Cnidaria':'0',
    'Crossaster':'0',
    'Cryptonatica':'0',
    'Diopedos bispinis':'0',
    'Fish':'0',
    'Fucus':'0',
    'Gersemia fruticosa':'0',
    'Gorgonocephalus':'0',
    'Gymnocanthus tricuspis':'0',
    'Heliometra':'0',
    'Hormathia':'0',
    'Human':'0',
    'Hyas':'0',
    'Laminaria_digitata':'0',
    'Lithothamnion':'0',
    'Mysis oculata':'0',
    'Ophiopholis':'0',
    'Ophiura robusta':'0',
    'Pagurus pubescens':'0',
    'Porifera':'0',
    'Strongylocentrotus':'0',
    'Trash':'0',
    'Urasterias':'0',
    'Urticina':'0',
    'arenicola':'0',
    'corophiidae':'0',
    'none':'0'

};

const worksheets = [
    {
        name: "Requests",
        columns: [
            {label: 'time', value: 'Time'},
            {label: 'Anthozoa', value: 'Anthozoa'},
            {label: 'Ascidia', value: 'Ascidia'},
            {label:  'Ascophyllum', value:  'Ascophyllum'},
            {label: 'Asterias', value: 'Asterias'},
            {label: 'Balanus', value: 'Balanus'},
            {label: 'Branchiomma', value: 'Branchiomma'},
            {label: 'Buccinum', value: 'Buccinum'},
            {label: 'Caridea', value: 'Caridea'},
            {label: 'Chionoecetes', value: 'Chionoecetes'},
            {label: 'Cnidaria', value: 'Cnidaria'},
            {label: 'Crossaster', value: 'Crossaster'},
            {label: 'Cryptonatica', value: 'Cryptonatica'},
            {label: 'Diopedos bispinis', value: 'Diopedos bispinis'},
            {label: 'Fish', value: 'Fish'},
            {label: 'Fucus', value: 'Fucus'},
            {label: 'Gersemia fruticosa', value: 'Gersemia fruticosa'},
            {label: 'Gorgonocephalus', value: 'Gorgonocephalus'},
            {label:   'Gymnocanthus tricuspis', value:   'Gymnocanthus tricuspis'},
            {label: 'Heliometra', value: 'Heliometra'},
            {label: 'Hormathia', value: 'Hormathia'},
            {label: 'Human', value: 'Human'},
            {label: 'Hyas', value: 'Hyas'},
            {label: 'Laminaria_digitata', value: 'Laminaria_digitata'},
            {label: 'Lithothamnion', value: 'Lithothamnion'},
            {label: 'Mysis oculata', value: 'Mysis oculata'},
            {label: 'Ophiopholis', value: 'Ophiopholis'},
            {label: 'Ophiura robusta', value: 'Ophiura robusta'},
            {label:  'Pagurus pubescens', value:  'Pagurus pubescens'},
            {label: 'Porifera', value: 'Porifera'},
            {label: 'Strongylocentrotus', value: 'Strongylocentrotus'},
            {label: 'Trash', value: 'Trash'},
            {label: 'Urasterias', value: 'Urasterias'},
            {label: 'Urticina', value: 'Urticina'},
            {label: 'arenicola', value: 'arenicola'},
            {label:  'corophiidae', value:  'corophiidae'},
            {label: 'none', value: 'none'}
        ],
        data: [

        ]
    }
];

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
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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


    async function exTest(filename = 'kkk', results = [['one','two','three'],['two','two','three'],['three','three']])


    {



        // async function onRetrieveTemplate() {
        //     return fetch("./export.xlsx").then((r) => r.blob());
        // }

        // async function generateReport() {
        //     return onRetrieveTemplate().then((xlsxBlob) => {
        //         const reader = new FileReader();
        //         reader.readAsArrayBuffer(xlsxBlob);
        //         reader.addEventListener("loadend", async (e) => {
        //             const renderer = new Renderer();
        //             const workbook = new ExcelJS.Workbook();
        //             const viewModel = { /* data */ };
        //
        //             const result = await renderer.render(() => {
        //                 return workbook.xlsx.load(reader.result).catch();
        //             }, viewModel);
        //
        //             // await result.xlsx.writeBuffer()
        //             //     .then((buffer) => saveAs(new Blob([buffer]), `${Date.now()}_result_report.xlsx`))
        //             //     .catch((err) => console.log("Error writing excel export", err));
        //         });
        //     });
        // }


        // const resp = await fetch('report-template.xlsx');
        // const buf = await resp.arrayBuffer();
        // const wb = new Excel.Workbook();
        // const workbook = wb.xlsx.load(buf);
        // console.log(workbook);


        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("My Sheet");


        function padTo2Digits(num) {
            return num.toString().padStart(2, '0');
        }

        function formatDate(date) {
            return [
                padTo2Digits(date.getDate()),
                padTo2Digits(date.getMonth() + 1),
                date.getFullYear(),
            ].join('/');
        }
        var date = formatDate(new Date());

        worksheet.getRow(1).values = ['????????????','??????????????','????????','??????????','?????? ????????????????','?????????? ??????????????','????????????????','????????????????????????','??????????????????','???????????????? ?? ???????????????? ????????????','??????????????????????']
        worksheet.getRow(2).values = ['','',date, '', '', '', '', 'BioGeoHab',filename, '', '']

        let colm = ['t ????????????',	't ??????????????????',	'?????????????????? ???????? (????????)',	'?????????????? ??',	'????????????????',	'????????????????????']

       let colmKey = [
            { key: 't0'},
            { key: 't1'},
            { key: 'degree'},
            { key: 'depth'},
            {key: 'sub'},
            {key: 'addition'}
        ];

        var merged = [].concat.apply([], results);
        let unique = [...new Set(merged)];
        for (let i = 0; i < unique.length; i++) {
            colm.push( unique[i] );
            colmKey.push({key:unique[i]});
        }
        worksheet.getRow(4).values = colm;

        console.log('MY COLM',colm);
        worksheet.columns = colmKey;
        console.log(worksheet.columns);

        let t0 = 0;

        for(let i=0;i<results.length;i++){
            const oneRow = results[i];

            const count = {};
            console.log(oneRow);


        oneRow.forEach(element => {
                count[element] = (count[element] || 0) + 1;
            });


        var newRow = {t0: t0.toString(), t1: (t0+10).toString() };
            for (let x in count) {
                newRow[x] =count[x].toString()
            }


            console.log(newRow);
            worksheet.addRow(newRow);
            t0=t0+10;

        }


        // save under export.xlsx


        const buffer = await workbook.xlsx.writeBuffer();
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const fileExtension = '.xlsx';

        const blob = new Blob([buffer], {type: fileType});

        // saveAs(blob, 'export' + fileExtension);



//UPLOADING FILE
//load a copy of export.xlsx
//         const reader = new FileReader();
//         const resp = await fetch('./export.xlsx');
//         const buf = await resp.blob();//resp.arrayBuffer();
//
//         await reader.readAsArrayBuffer(buf);
//         console.log(buf);
//         const newWorkbook = new ExcelJS.Workbook();
//         await newWorkbook.xlsx.load(reader.result).catch();

        // console.log(newWorkbook);


        const newworksheet = workbook.getWorksheet('My Sheet');
        console.log(newworksheet.columns)
        // const cell = worksheet.getCell('C3');
        //
        // cell.value = 666


        const buffer2 = await workbook.xlsx.writeBuffer();



        const blob2 = new Blob([buffer2], {type: fileType});

         saveAs(blob2, 'export2' + fileExtension);

        console.log("File is written");

    }




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
    await ffmpeg.run('-i', videoName, '-vf', 'crop=in_w:in_h-200,scale=960:-1', '-r', '0.1', dirName + '/%04d.png', '-fflags', 'discardcorrupt');



    const listDir1 = ffmpeg.FS("readdir", '.');
    console.log(listDir1);
    const listDir = ffmpeg.FS("readdir", dirName);
    console.log(listDir);

    var arr =[];

    for (let i = 2; i < listDir.length; i++) {


    const data = ffmpeg.FS('readFile', dirName + '/' + listDir[i]);
    arr.push(data.buffer);
    }

      console.log(arr);
      var numFruits = [];
      for (let i = 0; i < arr.length; i++) {


          var jopa = arr[i];
 
          const myImg = document.getElementById('input-image');

          var done = false;
          var res = "";
          myImg.onload = () => {

              res = handleImage(myImg);
              done = true;
          }

          myImg.src = URL.createObjectURL(new Blob([jopa], {type: 'image/png'}));
          while(!done){
              await sleep(10);
              res = await res;
          };


          numFruits.push(res);
          setMessage(`Predicted for ${i} frames from ${arr.length} `);
          console.log('HERE');
          console.log('aaaaaaaaaaaaaaaaaa', res);
      }
      // var merged = [].concat.apply([], numFruits);

      const promise4all = Promise.all(

          numFruits.map(function(innerPromiseArray) {
              return Promise.all(innerPromiseArray);
          })


      );
      console.log('promise4all',promise4all);
      promise4all.then(function(promiseGroupResult) {
          exTest( files[0]['name'],promiseGroupResult);
          setMessage(`Done in ${Date.now() - start} ms`);
          console.log("numFruits",numFruits);
          console.log('End')
      });




  }
  return (



    <Grid className={classes.root} container direction="column" alignItems="center" spacing={2}>
      {videoSrc.length === 0 ? null : (
        <Grid item>


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
            Upload a Video File
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={onFileUploaded}
            />
          </Button>

        )}
      </Grid>
      <Grid item>

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
