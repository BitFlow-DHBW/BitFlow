type Input = {
  gateId: number;
  xOffset?: number;
  yOffset?: number;
}

function newInput(gateId: number, xOffset: number = 0, yOffset: number = 0): Input {
  return {
    gateId: gateId,
    xOffset: Math.round(xOffset),
    yOffset: Math.round(yOffset),
  }
}

export {
  type Input,
  newInput,
}