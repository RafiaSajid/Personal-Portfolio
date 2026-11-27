import * as THREE from 'three';

const DESTINATION_CENTERS = {
  projects: { x: 112, z: -92 },
  skills: { x: -112, z: -78 },
  about: { x: 0, z: 120 }
};

export class WorldJourneyManager {
  constructor(scene, avatar, landmarks) {
    this.avatar = avatar;
    this.landmarks = landmarks;
    this.destination = 'home';
    this.busy = false;
    this.previousPosition = avatar.position.clone();
    this.currentNearbyProject = null;
    this.currentNearbyExhibit = null;
    this.currentNearbyExit = false;
    this.currentNearbyPortal = null;
    this.proximityKey = '';
    this.pendingDestination = null;
    this.destinations = {};
    this.createDestinations();
  }

  createDestinations() {
    const projectCenter = DESTINATION_CENTERS.projects;
    this.destinations.projects = this.landmarks.addProjectsDestination(projectCenter);
    const skillCenter = DESTINATION_CENTERS.skills;
    this.destinations.skills = this.landmarks.addSkillsDestination(skillCenter);
    const aboutCenter = DESTINATION_CENTERS.about;
    this.destinations.about = this.landmarks.addAboutDestination(aboutCenter);
  }

  getRaycastTargets() {
    return this.landmarks.raycastTargets;
  }

  enter(destinationId) {
    if (!['projects', 'skills', 'about'].includes(destinationId) || this.busy) return;
    if (this.destination === destinationId) {
      window.dispatchEvent(new CustomEvent('portfolio:destination-change', { detail: { destination: destinationId } }));
      return;
    }
    if (this.destination !== 'home') {
      this.pendingDestination = destinationId;
      this.returnHome();
      return;
    }

    const portalLandmark = this.landmarks.getHomeLandmarkById(destinationId);
    if (!portalLandmark) return;
    this.busy = true;
    this.landmarks.triggerPortalOpening(destinationId);
    this.avatar.clearCameraFocus?.();
    const portal = portalLandmark.visuals.group;
    portalLandmark.group.updateMatrixWorld(true);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(portal.getWorldQuaternion(new THREE.Quaternion()));
    const portalPosition = portal.getWorldPosition(new THREE.Vector3());
    const entry = portalPosition.add(normal.multiplyScalar(4.4));
    this.avatar.focusCameraOn?.(portalPosition.x, portalPosition.y + 2.55, portalPosition.z);
    this.avatar.transitionTo(entry.x, entry.z, 1.25, () => this.crossInto(destinationId));
  }

  crossInto(destinationId) {
    this.fadeThrough(() => {
      this.destination = destinationId;
      const center = DESTINATION_CENTERS[destinationId];
      this.avatar.clearCameraFocus?.();
      this.avatar.warpTo(center.x, 0, center.z + (this.destinations[destinationId]?.spawnZ ?? 18), Math.PI);
      this.currentNearbyPortal = null;
      this.currentNearbyExit = false;
      this.currentNearbyProject = null;
      this.currentNearbyExhibit = null;
      this.previousPosition.copy(this.avatar.position);
      this.busy = false;
      window.dispatchEvent(new CustomEvent('portfolio:destination-change', { detail: { destination: destinationId } }));
    });
  }

  returnHome({ nearby = false, crossed = false } = {}) {
    if (this.busy) return;
    if (this.destination === 'home') {
      this.avatar.warpTo(0, 0, 4, Math.PI);
      return;
    }
    this.busy = true;
    const source = this.landmarks.getLandmarkById(this.destination);
    this.landmarks.triggerPortalOpening(this.destination, 'exit');
    const exitPosition = source?.exitPortal?.getWorldPosition(new THREE.Vector3());
    const arriveHome = () => this.fadeThrough(() => {
      this.destination = 'home';
      this.avatar.clearCameraFocus?.();
      this.avatar.warpTo(0, 0, 4, Math.PI);
      this.currentNearbyPortal = null;
      this.currentNearbyExit = false;
      this.currentNearbyProject = null;
      this.currentNearbyExhibit = null;
      this.previousPosition.copy(this.avatar.position);
      this.busy = false;
      window.dispatchEvent(new CustomEvent('portfolio:destination-change', { detail: { destination: 'home', from: source?.data.id, exitPosition } }));
      if (this.pendingDestination) {
        const next = this.pendingDestination;
        this.pendingDestination = null;
        this.enter(next);
      }
    });
    if (exitPosition && !nearby && !crossed) {
      const portal = source.exitPortal;
      portal.updateWorldMatrix(true, false);
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(portal.getWorldQuaternion(new THREE.Quaternion()));
      const approach = exitPosition.clone().add(normal.multiplyScalar(4.4));
      this.avatar.focusCameraOn?.(exitPosition.x, exitPosition.y + 2.55, exitPosition.z);
      this.avatar.transitionTo(approach.x, approach.z, 0.95, arriveHome);
      return;
    }
    arriveHome();
  }

  fadeThrough(onCovered) {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const layer = document.getElementById('journey-transition');
    if (reduced || !layer) {
      onCovered();
      return;
    }
    layer.classList.add('active');
    window.setTimeout(() => {
      onCovered();
      window.setTimeout(() => layer.classList.remove('active'), 180);
    }, 180);
  }

  update() {
    if (this.busy) return;
    const position = this.avatar.position;
    this.updateProximity(position);
    this.checkPortalCrossing(position);
    this.previousPosition.copy(position);
  }

  updateProximity(position) {
    this.currentNearbyProject = null;
    this.currentNearbyExhibit = null;
    this.currentNearbyPortal = null;
    this.currentNearbyExit = false;
    let key = '';

    if (this.destination === 'home') {
      this.landmarks.portalTargets.forEach((portalData) => {
        const worldPosition = portalData.group.getWorldPosition(new THREE.Vector3());
        const distance = Math.hypot(position.x - worldPosition.x, position.z - worldPosition.z);
        if (distance < 7.5 && (!this.currentNearbyPortal || distance < this.currentNearbyPortal.distance)) {
          this.currentNearbyPortal = { id: portalData.destinationId, distance };
        }
      });
      if (this.currentNearbyPortal) key = `portal:${this.currentNearbyPortal.id}`;
    } else {
      const area = this.destinations[this.destination];
      if (this.destination === 'projects') {
        let nearest = null;
        area.projectDisplays.forEach(({ project, mesh }) => {
          const point = mesh.getWorldPosition(new THREE.Vector3());
          const distance = Math.hypot(position.x - point.x, position.z - point.z);
          if (distance < 5.5 && (!nearest || distance < nearest.distance)) nearest = { project, distance };
        });
        this.currentNearbyProject = nearest;
        if (nearest) key = `project:${nearest.project.id}`;
      } else if (this.destination === 'about') {
        let nearestExhibit = null;
        area.exhibitDisplays?.forEach(({ exhibit, mesh }) => {
          const point = mesh.getWorldPosition(new THREE.Vector3());
          const distance = Math.hypot(position.x - point.x, position.z - point.z);
          if (distance < 5.5 && (!nearestExhibit || distance < nearestExhibit.distance)) {
            nearestExhibit = { exhibit, mesh, distance };
          }
        });
        this.currentNearbyExhibit = nearestExhibit;
        if (nearestExhibit) key = `exhibit:${nearestExhibit.exhibit.id}`;
      }
      const exitPoint = area.exitPortal.getWorldPosition(new THREE.Vector3());
      const exitDistance = Math.hypot(position.x - exitPoint.x, position.z - exitPoint.z);
      this.currentNearbyExit = exitDistance < 7.5;
      if (this.currentNearbyExit) key = 'exit:home';
    }

    if (key !== this.proximityKey) {
      this.proximityKey = key;
      window.dispatchEvent(new CustomEvent('portfolio:journey-proximity', {
        detail: {
          key,
          portal: this.currentNearbyPortal?.id || null,
          project: this.currentNearbyProject?.project || null,
          exhibit: this.currentNearbyExhibit?.exhibit || null,
          exit: this.currentNearbyExit
        }
      }));
    }
  }

  checkPortalCrossing(position) {
    if (this.destination === 'home') {
      this.landmarks.portalTargets.some((portal) => {
        if (this.crossedPlane(portal.group, this.previousPosition, position, 1.7, 2.35)) {
          this.enter(portal.destinationId);
          return true;
        }
        return false;
      });
      return;
    }
    const exit = this.destinations[this.destination]?.exitPortal;
    if (exit && this.crossedPlane(exit, this.previousPosition, position, 1.7, 2.3)) this.returnHome({ crossed: true });
  }

  crossedPlane(portal, previousWorld, currentWorld, halfWidth, halfHeight) {
    portal.updateWorldMatrix(true, false);
    const inverse = portal.matrixWorld.clone().invert();
    const before = previousWorld.clone().applyMatrix4(inverse);
    const after = currentWorld.clone().applyMatrix4(inverse);
    const crossed = (before.z > 0 && after.z <= 0) || (before.z < 0 && after.z >= 0);
    return crossed
      && Math.abs(before.x) <= halfWidth && Math.abs(after.x) <= halfWidth
      && Math.abs(before.y) <= halfHeight && Math.abs(after.y) <= halfHeight
      && Math.abs(before.z - after.z) < 2.5;
  }
}
