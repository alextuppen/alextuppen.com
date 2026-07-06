---
title: "Building a Home Assistant status display"
description: "Documenting how I built a Home Assistant status display for my desktop to show the weather forecast and details of my home."
pubDate: "2026/07/01"
heroImage: "/blog/depressing-meeting.webp"
heroImageText: "An image generated using DeepAI with the prompt: a cartoon drawing of a software developer in a depressing meeting with faceless coworkers"
---

I like going for walks, they break my day up, they get me out of my chair and they let me spend some time looking at trees, which are much nicer than walls and monitors.
Unfortunately I live in the UK and sometimes it rains, often, just when I want to go for a walk. This was an excellent excuse for an extremely over engineered and time consuming project.

# Requirements and constraints

As a software developer I spend a lot of time at my desk, and it is my desk that I want to get away from when I go for a walk, so I wanted an easy way to see what the weather would be for the day from my desk.
It was also important that I didn't have to go digging for yet another window on my desktop to see the weather, I'd always get distracted by something and forget to check the weather until I wanted to go for a walk by which point it might be too late because the rain had started and was staying for hours.

The initial requirements for the project therefore became:

- A low powered, non-distracting display that could be mounted alongside my computer monitors
- Today's weather forecast updated frequently enough to be useful
- The time of today's sunset

# E-Paper display

These requirements, and my interest in making things more interesting for myself, led naturally to an E-Paper display.
Known primarily for their use in e-readers like the Kindle these displays only consume power when they are updating and are easily legible in any lighting conditions.
They are not however, the easiest devices to work with as they are fundamentally very different to a normal monitor.

And of course while thinking about this project the scope had expanded, if it was hooked up to my Home Assistant server it would make fetching the weather much easier, and I would be able to display other things about my flat.

Fortunately the company Waveshare have kindly solved both of these problems for me.

## Waveshare E-Paper ESP32 driver board

The core of this project is a Waveshare E-Paper ESP32 Driver Board, it handles the complexity of driving an e-paper display and, using ESPHome, it can be configured entirely with a single YAML file.

![Photograph of a Waveshare E-Paper ESP32 driver board](./e-paper-esp32-driver-board-1_3.jpg)

The e-paper display itself is a WaveShare 7.5" red, black and white E-Paper E-Ink display, it has a good balance of price to size and its ability to render red gave the entire project yet another use.

![Photograph of a Waveshare 7.5 inch Black, White and Red E-Paper display](./7.5inch-e-paper-b-2_4.jpg)

# Home Assistant alerts & events

My flat has leak sensors installed in the kitchen and bathrooms, these are already configured to send push notifications the moment a leak is detected.
But as any home owner knows leaks can be very damaging very quickly, so I wanted my status display to also alert me as soon as possible in case I was at my desk without my phone.

This is where the red colour of the e-paper display comes in, when an alert is triggered the display renders an alert instead:

<photo of e-paper alert state>

But sometimes you want to be notified about something in real time, and the e-paper display isn't suitable because it has a finite number of refreshes and each refresh takes about 15 seconds.

## I2C display

Unfortunately the SPI bus is entirely occupied by the e-paper on this driver board so larger TFT screens are incompatible.
But the I2C bus is completely free, and if you just want to be able to display short notification messages then its low bandwidth is not an issue.

![Photograph of a Hailege 2.42" SSD1309 128x64 OLED Display](./Hailege-2.42-SSD1309-128x64-OLED-Display.jpg)

So when someone knocks at your door, you have a second real time display that can show a simple message like "Front door knocked".

<photo of OLED display with front door knocked message>

So I went looking for the nicest I2C display I could find and Amazon stocks the Hailege 2.42" SSD1309 128x64 OLED display.
The bright clear image is easy to read and the display is large enough to show 3 lines of text.

## Temperature, humidity and CO2 sensor

Given we have an ESP32 board, and there is space on the I2C bus for more than just the secondary display, I wondered what else would be useful.
I knew that CO2 concentration in the air affects your ability to mentally concentrate, so I went looking for a cheap CO2 sensor, and the SCD40 fit the bill perfectly.

![Photograph of an SCD40 Gas Sensor](./SCD40-Gas-Sensor.jpg)

And to notify me when the CO2 levels are too high, we can use the OLED display.

<photo of open window notification>

# 3D printed case

All of these components need a structure to hold them together and some way of mounting them.
Given I want this display to be mounted on my desk near my monitors, and my monitors are all on arms a VESA mount on the back was the logical choice.
What came next was the hardest piece of 3D modelling I have undertaken to date.

![Screenshot of the complete 3D model](./HA-status-complete.png)

The core of the build is a chassis, this has eight M2 heat set threaded inserts to hold the OLED display and ESP32 carrier board.
It also has four M5 inserts for the VESA mount, the chassis is pictured below with the modelled OLED display (on the reverse) and ESP32 carrier and board.

![Screenshot of the chassis with the mdoelled OLED display and ESP32 carrier and board](./HA-status-chassis.png)

In front of that is the fascia, with cut outs for the OLED and e-paper displays, the e-paper display is held in place by being sandwiched between the chassis and fascia.
The fascia also contains seven M3 heat set threaded inserts that are used to secure the back, chassis and fascia together.

![Screenshot of the reverse of the fascia](./HA-status-fascia.png)

The final piece is the backing, it has screw holes and cut outs to allow for air flow to the SCD40 sensor and a power cable for the ESP32.

![Screenshot of the backing](./HA-status-backing.png)

# YAML
