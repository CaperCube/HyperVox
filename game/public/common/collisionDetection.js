function getIntersectionPoints(lineSegment, boundingBox) {
    // Define variables for the minimum and maximum x, y, and z coordinates of the line segment
    let xMin = Math.min(lineSegment.p1.x, lineSegment.p2.x);
    let xMax = Math.max(lineSegment.p1.x, lineSegment.p2.x);
    let yMin = Math.min(lineSegment.p1.y, lineSegment.p2.y);
    let yMax = Math.max(lineSegment.p1.y, lineSegment.p2.y);
    let zMin = Math.min(lineSegment.p1.z, lineSegment.p2.z);
    let zMax = Math.max(lineSegment.p1.z, lineSegment.p2.z);
  
    // Define variables for the minimum and maximum x, y, and z coordinates of the bounding box
    // ToDo: These should be represented by { x, y, z, w, h, d }
    let boxXMin = boundingBox.p1.x;
    let boxXMax = boundingBox.p2.x;
    let boxYMin = boundingBox.p1.y;
    let boxYMax = boundingBox.p2.y;
    let boxZMin = boundingBox.p1.z;
    let boxZMax = boundingBox.p2.z;
  
    // Calculate the intersection points by checking if the line segment intersects
    // with each side of the bounding box
    let intersectionPoints = [];

    // ToDo: This logic does not appear to be correct, as there are many duplicate statements
    if (xMin <= boxXMax && xMax >= boxXMin) {
        if (yMin <= boxYMax && yMax >= boxYMin) {
            if (zMin <= boxZMax && zMax >= boxZMin) {
                intersectionPoints.push({x: xMin, y: yMin, z: zMin});
            }
            if (zMin <= boxZMax && zMax >= boxZMin) {
                intersectionPoints.push({x: xMin, y: yMin, z: zMax});
            }
        }
        if (yMin <= boxYMax && yMax >= boxYMin) {
            if (zMin <= boxZMax && zMax >= boxZMin) {
                intersectionPoints.push({x: xMin, y: yMax, z: zMin});
            }
            if (zMin <= boxZMax && zMax >= boxZMin) {
                intersectionPoints.push({x: xMin, y: yMax, z: zMax});
            }
        }
    }
    if (yMin <= boxYMax && yMax >= boxYMin) {
        if (xMin <= boxXMax && xMax >= boxXMin) {
            if (zMin <= boxZMax && zMax >= boxZMin) {
                intersectionPoints.push({x: xMax, y: yMin, z: zMin});
            }
            if (zMin <= boxZMax && zMax >= boxZMin) {
                intersectionPoints.push({x: xMax, y: yMin, z: zMax});
            }
        }
        if (xMin <= boxXMax && xMax >= boxXMin) {
            //...
        }
        //...
    }
}