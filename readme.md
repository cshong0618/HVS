# HVS
HVS stands for Home Video Server. A simple web-based file explorer with built in video streaming capability. 

## How to run?
`npm start`

### Environment Variables
|Variable|Purpose|Example|
|---|---|---|
|`host`|Which hostname to run the server on|`host=0.0.0.0`|
|`port`|Which port to run the server on|`port=12345`|
|`root`|The root folder for navigation|`root=/mnt/data`|

*Using `0.0.0.0` on host will expose the server  to the network.*

## About the video player
The video player used is built on HTML5 and VanillaJS.

|Keyboard Shortcut|Function|
|---|---|
|`Up Arrow`|Increase volume|
|`Down Arrow`|Decrease volume|
|`Right Arrow`|Forward 5 seconds|
|`Left Arrow`|Rewind 5 seconds|
|`F`|Fullscreen toggle|
|`Space`|Play/Pause|


## Bonus/おまけ
- Opening unknown file types will initiate download.
- Navigating to a folder with only images will invoke the manga function where HVS will become a manga reader.