# CloneFest-Week-3

CloneFest 2025 — Reimagining a C-based Minigolf Classic
Title
Introductory Challenge: Porting a 3D Minigolf Asset to the Web

Background
This project is an introductory exercise in 3D web graphics, inspired by the open-source game "Open Golf." The objective is to familiarize participants with the fundamentals of rendering and interacting with a 3D scene in a web browser. The scope is intentionally limited to the successful implementation of a single, interactive level, providing a foundational experience in web-based 3D development.
Core Objective
The primary goal is to render a single, static 3D golf hole using the Three.js library. The scene must contain a golf ball object that a user can interact with, demonstrating a complete, albeit simple, feedback loop from user input to 3D visualization.
While Three.js is recommended as the primary framework for web-based rendering, participants are free to use Unity (WebGL export) or other equivalent tools if they prefer.
Successful completion is defined by the correct implementation of the project requirements outlined below.
Project Requirements
1. Scene and Asset Rendering
A Three.js scene must be initialized with appropriate camera, lighting, and rendering configurations.
A 3D model representing a single golf course hole must be successfully loaded and displayed within the scene. The choice of a specific 3D asset is left to the participant's discretion.
A distinct geometric object, such as a sphere, must be rendered to represent the golf ball, positioned at a designated starting point on the course.



2. Basic Physics and Interaction
A mechanism for user input must be implemented to apply a velocity to the golf ball object.
The ball's movement should be governed by a simplified physics model. At a minimum, this should include an implementation of friction that causes the ball to decelerate and eventually come to a stop after being struck.
The use of a full physics engine is not required.


3. Core Gameplay and State Management
The application must manage the game state, including tracking the current hole, par, and the player's stroke count.
A goal detection system is required to identify when a level is successfully completed.
Only the first two levels (holes) are required to be implemented.


4. Player Controls and Interaction
An intuitive control system for the player is mandatory. This must include:
Aiming Precision: A mechanism for the player to accurately aim the direction of their shot.
Power Control: A system for the player to determine the velocity or strength of their shot.
The system should provide clear visual feedback to the user during both aiming and power selection.


5. Camera System
An interactive camera system must be implemented to allow the user to inspect the course.
Standard controls such as orbit, pan, and zoom are expected.


6. User Interface (UI)
A clean user interface, implemented in HTML, must clearly display all essential game information (e.g., hole number, stroke count).
The UI should also provide any necessary interactive elements.




Bonus Objective
For participants who complete the core requirements, the optional bonus objective is to expand the two-hole experience into a three-level game.
Level Management: Implement a system capable of loading and managing a sequence of three predefined levels. The third level must include terrain variations (e.g., slopes, ramps, or curved surfaces) to increase gameplay complexity.
Level Navigator: Create a UI that allows the player to transition between levels. This could be an end-of-hole screen with a “Next Level” button or a main menu for level selection.
Persistent Score: Extend the game state to track and display a total score across all completed levels. Scores should be saved in a database, and retrieval must be linked to email-based authentication so players can continue from their progress across sessions.




