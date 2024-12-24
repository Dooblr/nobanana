import React from 'react';
import ProjectileObject from './ProjectileObject';
import { PROJECTILE_SPEED, PROJECTILE_RADIUS } from '../constants';

const ProjectileSystem = ({ projectiles, onProjectileHit, enemies }) => {
    return (
        <group>
            {projectiles.map(projectile => (
                <ProjectileObject
                    key={projectile.id}
                    position={projectile.position}
                    direction={projectile.direction}
                    velocity={PROJECTILE_SPEED}
                    radius={PROJECTILE_RADIUS}
                    onHit={onProjectileHit}
                    enemies={enemies}
                />
            ))}
        </group>
    );
};

export default ProjectileSystem; 