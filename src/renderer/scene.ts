import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
	CSS2DObject,
	CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";

const AXIS_LEN = 1.3;
const AXIS_HEAD = 0.1;
const AXIS_HEAD_W = 0.06;

export class BlochScene {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private labelRenderer: CSS2DRenderer;
	private controls: OrbitControls;
	private stateArrow: THREE.ArrowHelper;
	private extraArrows = new Map<string, THREE.ArrowHelper>();
	private rafId?: number;

	constructor(canvas: HTMLCanvasElement, labelContainer: HTMLElement) {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x0d1117);

		this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
		this.camera.up.set(0, 0, 1); // Z is up (north pole = |0⟩)
		this.camera.position.set(2.5, -2.0, 1.5);
		this.camera.lookAt(0, 0, 0);

		this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.labelRenderer = new CSS2DRenderer({ element: labelContainer });
		this.labelRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
		labelContainer.style.pointerEvents = "none";

		this.controls = new OrbitControls(this.camera, canvas);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;

		this.addSphere();
		this.addAxes();
		this.addLabels();

		// State vector arrow in purple
		const initDir = new THREE.Vector3(0, 0, 1);
		this.stateArrow = new THREE.ArrowHelper(
			initDir,
			new THREE.Vector3(0, 0, 0),
			1,
			0xbb86fc,
			0.15,
			0.08,
		);
		this.scene.add(this.stateArrow);

		new ResizeObserver(() => this.resize(canvas)).observe(canvas);
		this.resize(canvas);
	}

	private addSphere(): void {
		const geo = new THREE.SphereGeometry(1, 36, 36);
		this.scene.add(
			new THREE.Mesh(
				geo,
				new THREE.MeshBasicMaterial({
					color: 0x3a3a5c,
					transparent: true,
					opacity: 0.08,
					side: THREE.DoubleSide,
				}),
			),
		);
		this.scene.add(
			new THREE.Mesh(
				geo,
				new THREE.MeshBasicMaterial({
					color: 0x555577,
					wireframe: true,
					transparent: true,
					opacity: 0.15,
				}),
			),
		);
	}

	private addAxes(): void {
		const axes: [THREE.Vector3, number, string | null][] = [
			[new THREE.Vector3(1, 0, 0), 0xff5555, "X"],
			[new THREE.Vector3(-1, 0, 0), 0x993333, null],
			[new THREE.Vector3(0, 1, 0), 0x55ff55, "Y"],
			[new THREE.Vector3(0, -1, 0), 0x339933, null],
			[new THREE.Vector3(0, 0, 1), 0x5555ff, "Z"],
			[new THREE.Vector3(0, 0, -1), 0x333399, null],
		];
		for (const [dir, color, axisLabel] of axes) {
			this.scene.add(
				new THREE.ArrowHelper(
					dir,
					new THREE.Vector3(0, 0, 0),
					AXIS_LEN,
					color,
					AXIS_HEAD,
					AXIS_HEAD_W,
				),
			);
			if (axisLabel) {
				const hex = `#${color.toString(16).padStart(6, "0")}`;
				this.addLabel(
					axisLabel,
					dir.clone().multiplyScalar(AXIS_LEN + 0.12),
					"axis-label",
					hex,
				);
			}
		}
	}

	private addLabel(
		text: string,
		pos: THREE.Vector3,
		className = "sphere-label",
		color?: string,
	): void {
		const div = document.createElement("div");
		div.className = className;
		div.textContent = text;
		if (color) div.style.color = color;
		const obj = new CSS2DObject(div);
		obj.position.copy(pos);
		this.scene.add(obj);
	}

	private addLabels(): void {
		this.addLabel("|0⟩", new THREE.Vector3(0.05, 0, 1.45));
		this.addLabel("|1⟩", new THREE.Vector3(0.05, 0, -1.45));
		this.addLabel("|+⟩", new THREE.Vector3(1.5, 0, 0));
		this.addLabel("|-⟩", new THREE.Vector3(-1.5, 0, 0));
		this.addLabel("|i⟩", new THREE.Vector3(0, 1.5, 0));
		this.addLabel("|-i⟩", new THREE.Vector3(0, -1.5, 0));
	}

	private resize(canvas: HTMLCanvasElement): void {
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(w, h, false);
		this.labelRenderer.setSize(w, h);
	}

	addArrow(id: string, color: number): void {
		if (this.extraArrows.has(id)) return;
		const arrow = new THREE.ArrowHelper(
			new THREE.Vector3(0, 0, 1),
			new THREE.Vector3(0, 0, 0),
			1,
			color,
			0.15,
			0.08,
		);
		arrow.visible = false;
		this.scene.add(arrow);
		this.extraArrows.set(id, arrow);
	}

	updateArrow(id: string, x: number, y: number, z: number): void {
		const arrow = this.extraArrows.get(id);
		if (!arrow) return;
		const len = Math.sqrt(x * x + y * y + z * z);
		if (len < 1e-6) {
			arrow.visible = false;
			return;
		}
		arrow.visible = true;
		arrow.setDirection(new THREE.Vector3(x / len, y / len, z / len));
		arrow.setLength(len, 0.15, 0.08);
	}

	removeArrow(id: string): void {
		const arrow = this.extraArrows.get(id);
		if (arrow) {
			this.scene.remove(arrow);
			this.extraArrows.delete(id);
		}
	}

	updateVector(x: number, y: number, z: number): void {
		const len = Math.sqrt(x * x + y * y + z * z);
		if (len < 1e-6) {
			this.stateArrow.visible = false;
			return;
		}
		this.stateArrow.visible = true;
		this.stateArrow.setDirection(new THREE.Vector3(x / len, y / len, z / len));
		this.stateArrow.setLength(len, 0.15, 0.08);
	}

	startLoop(onFrame: (now: number) => void): void {
		const loop = (now: number): void => {
			this.rafId = requestAnimationFrame(loop);
			onFrame(now);
			this.controls.update();
			this.renderer.render(this.scene, this.camera);
			this.labelRenderer.render(this.scene, this.camera);
		};
		this.rafId = requestAnimationFrame(loop);
	}

	stopLoop(): void {
		if (this.rafId !== undefined) cancelAnimationFrame(this.rafId);
	}
}
