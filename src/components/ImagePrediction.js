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
const numColsToCut = 2;
const numRowsToCut = 2;
const widthOfOnePiece = 250;
const heightOfOnePiece = 250;

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




function handleImage(img) {

    var targetWidth =  WIDTH;
    ctx.drawImage(img, 0, 0);
    console.log("IMAGE BEFORE",ctx.getImageData(0, 0,WIDTH,WIDTH).data)
    const resizedImageDataArray = processImage(img, targetWidth);
    const results =[];
    for (let i =0; i<resizedImageDataArray.length; i++){
    console.log("IMAGE",resizedImageDataArray[i])

    const inputTensor = imageDataToTensor(resizedImageDataArray[i], DIMS);
    console.log('TENSOR',inputTensor)
    var oneRes = run(inputTensor);

    console.log("One piece result ",oneRes);

    results.push(oneRes);
    }

    return(results);

}

async function getBlob(url) {
    return await fetch(url).then(r => r.blob());
}

//
function processImage(img, width) {

    var imagePieces = [];
    for(var x = 0; x < numColsToCut; ++x) {
        for(var y = 0; y < numRowsToCut; ++y) {
            const canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d");
            canvas.width = widthOfOnePiece;
            canvas.height = heightOfOnePiece;
            ctx.drawImage(img, x * widthOfOnePiece, y * heightOfOnePiece, widthOfOnePiece, heightOfOnePiece, 0, 0, canvas.width, canvas.height);
            imagePieces.push(ctx.getImageData(0, 0, width, width).data);
        }}

    return imagePieces;}


// function processImage(img, width) {
//     const canvas = document.createElement("canvas"),
//         ctx = canvas.getContext("2d");
//
//     canvas.width = width;
//     canvas.height = canvas.width * (img.height / img.width);
//     ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//     return [ctx.getImageData(0, 0, width, width).data];
// }

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





class SingletonAiModelSession {

    constructor() {

        const modelFile = `./static/js/my_classification.onnx`;
        console.log("loading onnx model");
        console.log(modelFile);

        this.session = (async () => {
            return (await InferenceSession.create(modelFile,{executionProviders: ['wasm']}));
        })();
        SingletonAiModelSession.instance=this;
    }

    static async getInstance() {
        if (!SingletonAiModelSession.instance) {
            SingletonAiModelSession.instance=new SingletonAiModelSession();
            console.log('I9N876543456789876543456789',SingletonAiModelSession.instance.session);
            SingletonAiModelSession.instance.session = await SingletonAiModelSession.instance.session;
            console.log('99999999999',SingletonAiModelSession.instance.session);
        }
        return SingletonAiModelSession.instance.session;
    }
}

async function run(inputTensor) {
    try {

        const modelFile = `./static/js/my_classification.onnx`;
        console.log("loading onnx model");
        console.log(modelFile);


        const session =await SingletonAiModelSession.getInstance();
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