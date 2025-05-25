export { encodeWAV, evaluate, generatePCM, tokenize, typeify };

// sample[n]= A ⋅ sin(2 * π * f * (n / R)​)

// Where:
//   A: Amplitude (max value based on bit depth, e.g., 32767 for 16-bit)
//   f: Frequency (Hz), e.g., middle C = 261.63 Hz
//   R: Sample rate (samples per second), typically 44100 Hz
//   n: Sample number (integer), from 0 to R × duration − 1

function generatePCM(frequency, duration) {
  const amplitude = 32767;
  const sampleRate = 44100;

  const numSamples = Math.floor(sampleRate * (duration / 1000));

  const samples = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = amplitude * Math.sin(2 * Math.PI * frequency * t);
    samples.push(sample);
  }

  return samples;
}

async function encodeWAV(
  samples,
  output = "output.wav",
  sampleRate = 44100,
) {
  const headerSize = 44;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(headerSize + i * 2, samples[i], true);
  }

  await Deno.writeFile(
    output,
    new Uint8Array(buffer),
  );
}

const atom = (name) => Symbol.for(name);

const typeify = (token) => {
  throw new Error("Not implemented");
};

const tokenize = (input) => {
  const arr = [];
  
  // Helper function to check if a string is a valid number (not just NaN)
  const isNumeric = (str) => !isNaN(str) && !isNaN(parseFloat(str));

  // Main recursive function
  const loop = (
    [graphemeAtHand, ...restOfGraphemes], 
    tokenSoFar = ""
  ) => {
    if (graphemeAtHand == undefined) {
      // End of input, finalize the last token
      if (tokenSoFar.trim()) {
        if (isNumeric(tokenSoFar)) {
          arr.push(parseFloat(tokenSoFar)); // assuming 'atom' converts the number to an atomic form
        } else {
          arr.push(atom(tokenSoFar));
        }
      }
      return;
    }

    // If the character is a space, finalize the token so far
    if (graphemeAtHand === " ") {
      if (tokenSoFar.trim()) {
        if (isNumeric(tokenSoFar)) {
          arr.push(parseFloat(tokenSoFar)); // process numeric token
        } else {
          arr.push(atom(tokenSoFar)); // process non-numeric token
        }
      }
      // Recursively call for the next part of the string
      loop(restOfGraphemes, "");
    } else {
      // Otherwise, keep adding the current grapheme to the token
      loop(restOfGraphemes, tokenSoFar + graphemeAtHand);
    }
  };

  // Start recursion with input as an array of graphemes
  loop(input.split(''));
  
  return arr;
};


const evaluate = (expression) => {
  // If the expression is a number, return it
  // If it is an array,
  //   assume the first element is a function and the rest are arguments
  //   evaluate the function with the arguments

  if (isNaN(expression)) {
    return expression;
  }
  if (Array.isArray(expression)) {
    const [func, ...args] = expression;
    return func(...args);
  }
};
