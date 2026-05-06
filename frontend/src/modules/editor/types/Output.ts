type Output = {
  gateId: number;
  xOffset?: number;
  yOffset?: number;
  logicFunction?: Function
}

function newOutput(gateId: number, xOffset: number = 0, yOffset: number = 0, logicFunction: Function = (() => "low" as const)): Output {
  return {
    gateId: gateId,
    xOffset: Math.round(xOffset),
    yOffset: Math.round(yOffset),
    logicFunction: logicFunction,
  }
}

export {
  type Output,
  newOutput,
}