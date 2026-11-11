// Missing solver diagnostics are not zero residuals.
export function formatResidual(error) {
 const value=(x,scale,places)=>Number.isFinite(x)?(x*scale).toFixed(places):'not evaluated';
 return `${value(error.positionResidualM,1000,3)} mm translation; ${value(error.angularResidualRad,180/Math.PI,4)}° rotation`;
}
// Keep every discrete slider step visible, including fractional metre/latent steps.
export function formatSliderValue(value,step,unit='') {
 if(!Number.isFinite(step)||step<=0)throw new RangeError('A finite positive slider step is required');
 const [coefficient,exponent='0']=String(step).split('e');
 const places=Math.max(0,(coefficient.split('.')[1]?.length??0)-Number(exponent));
 return (Number.isFinite(value)?value.toFixed(Math.min(100,places)):'not available')+unit;
}
