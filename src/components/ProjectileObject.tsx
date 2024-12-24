import React from 'react';
import { Vector3 } from 'three';

const ProjectileObject = ({ position, direction, velocity, radius, onHit, enemies }) => {
    // Your projectile logic here
    return (
        <mesh position={position}>
            <sphereGeometry args={[radius]} />
            <meshStandardMaterial color="#ff0" />
        </mesh>
    );
};

export default ProjectileObject; 