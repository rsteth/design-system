// Labels describe the fitted sign convention, not new semantic control axes.
export function pcaDirectionNote(pca){
 const descriptions={y:'farther-forward training poses',z:'higher training poses'};
 const axes=pca.orientation.map(item=>`+PC${item.component} toward ${descriptions[item.axis]}`);
 return `PCA signs are arbitrary. This example chooses ${axes.join(' and ')}. These remain mixed fitted axes, not Reach / Present or universal meanings.`;
}
export const VIEW_DIRECTION_NOTE='Physical +Y means forward from the torso; it appears down-left in this front view. Joint rotations are not forward-distance controls.';
export const CHART_DIRECTION_NOTE='Larger physical +Y is rightward on this coordinate chart, but down-left in the robot view. The chart axes are not screen directions for the robot.';
