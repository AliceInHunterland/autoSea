import {InferenceSession, Tensor} from "onnxruntime-web";
import * as Jimp from "jimp";
import {useState} from "react";


const ort = require("onnxruntime-web");


// ======================================================================
// Global variables
// ======================================================================

const WIDTH = 250;
const DIMS = [1, 3, WIDTH, WIDTH];
const MAX_LENGTH = DIMS[0] * DIMS[1] * DIMS[2] * DIMS[3];
const MAX_SIGNED_VALUE = 255.0;
const classes = require("./imagenet_classes.json").data;


let predictedClass;
let isRunning = false;



// ======================================================================
// DOM Elements
// ======================================================================




const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d");

// ======================================================================
// Functions
// ======================================================================


function onLoadImage(fileReader) {

    var img = document.getElementById("input-image");
    console.log(img);
    img.onload = () => handleImage(img);
    img.src = fileReader.result;
}

async function handleImage(img) {
    // const img = document.getElementById('input-image');
    // var img = document.getElementById("input-image");
    // img.src =img1;// URL.createObjectURL(new Blob([img1], {type: 'image/png'}))
    var targetWidth =  WIDTH;
    ctx.drawImage(img, 0, 0);
    console.log("IMAGE BEFORE",ctx.getImageData(0, 0,WIDTH,WIDTH).data)
    const resizedImageData = processImage(img, targetWidth);
    console.log("IMAGE",resizedImageData)

    const inputTensor = imageDataToTensor(resizedImageData, DIMS);
    console.log('TENSOR',inputTensor)
    var res = run(inputTensor);
    console.log(res);
    return(res);

}
// function processImage(img, width) {
//     const canvas = document.createElement("canvas"),
//         ctx = canvas.getContext("2d");
//
//     canvas.width = width;
//     canvas.height = canvas.width * (img.height / img.width);
//
//     getBlob(img.src).then((blob) => {
//         const reader = new FileReader();
//         reader.readAsDataURL(blob);
//         reader.onloadend = function () {
//             const base64String = reader.result;
//             const image = new Image();
//             image.onload = () => {
//                 ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
//                 // console.log('!!!resizedImageDataimageimage', image);
//                 // console.log('!!!resizedImageData', canvas.toDataURL());
//                 return ctx.getImageData(0, 0, width, width).data;
//             }
//             image.src = base64String;
//         }
//     });
// }

async function getBlob(url) {
    return await fetch(url).then(r => r.blob());
}

function processImage(img, width) {
    const canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = canvas.width * (img.height / img.width);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const image = new Image();
    image.onload=()=>ctx.drawImage(image,0,0,canvas.width, canvas.height);
    // image.src= URL.createObjectURL(img.src);
    // document.getElementById("canvas-image").src = canvas.toDataURL();
    return ctx.getImageData(0, 0, width, width).data;
}

function imageDataToTensor(data, dims) {
    // 1. filter out alpha
    // 2. transpose from [224, 224, 3] -> [3, 224, 224]
    const [R, G, B] = [[], [], []];
    for (let i = 0; i < data.length; i += 4) {
        R.push(data[i]);
        G.push(data[i + 1]);
        B.push(data[i + 2]);
        // here we skip data[i + 3] because it's the alpha channel
    }
    const transposedData = R.concat(G).concat(B);

    // convert to float32
    let i,
        l = transposedData.length; // length, we need this for the loop
    const float32Data = new Float32Array(MAX_LENGTH); // create the Float32Array for output
    for (i = 0; i < l; i++) {
        float32Data[i] = transposedData[i] / MAX_SIGNED_VALUE; // convert to float
    }

    // return ort.Tensor
    const inputTensor = new ort.Tensor("float32", float32Data, dims);
    return inputTensor;
}

function argMax(arr) {
    let max = arr[0];
    let maxIndex = 0;
    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }
    return [max, maxIndex];
}







async function run(inputTensor) {
    try {

        const modelFile = `./static/js/my_classification.onnx`;
        console.log("loading onnx model");
        console.log(modelFile);


        const session = await InferenceSession.create(modelFile,{executionProviders: ['wasm']});
        // const dataA = new Float32Array(187500);
        // const tensorA = new Tensor('float32', dataA, [1,3, 250, 250]);



        const feeds = { input: inputTensor };

        // feed inputs and run

            const results = await session.run(feeds);
            console.log(results)



        const [maxValue, maxIndex] = argMax(results.output.data);
        console.log(results.output.data);
        // document.write(results.output.data);
        predictedClass = `${classes[maxIndex]}`;
        console.log(predictedClass)
        isRunning = false;
        return(predictedClass);
    } catch (e) {
        console.error(e);
        isRunning = false;
        return(e);
    }
}
// export default onLoadImage;


export default handleImage;