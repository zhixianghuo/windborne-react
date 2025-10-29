# Junior Web Developer Application

Hi, my name is Zhixiang(Oliver) Huo. I am a frontend developer with 4 years experience on web application developments. I use Angular 19/React 18 in frontend development, and Node.js/Java as backend service(BFF). I have several work experience on Protoplay.tv, Swif.ai, Antra ,and United Airlines. In my most recent project at United Airlines, I was working on a morderation of an internal application, called CCS+, which is used by 15,000 pilots and crew member to manage their trips and schedule daily. 

In my earler experience, after I received my bachelor's degree of Computer Science from UMass Amherst, I, and 2 friends, we started to build a video sharing platform, protoplay.tv, from 0 to 1. Our goal of building this website was creating a free-speech video sharing platform. 

## engineering challenge

1. (DONE) Query our live constellation API

2. (DONE) Find another existing public dataset/API and combine these two into something!
   - Use free weather API from https://open-meteo.com/ to retrive the wind/temp data of the ballon's location
   - There is a limit of usage of the data, if you dont see anything on the graph, please check it in hours or tomorrow, it caused by Open-Meteo rate limit reached.

## 24h live ballon tracker
- Windborne Constellation is a 24-hour live balloon tracker that correlates real-time trajectories with Open-Meteo wind/temperature data to score drift-vs-wind alignment. I built a Next.js 14 + React 18 app with React-Leaflet maps, Recharts, and Tailwind, featuring smart filtering for 500 balloons, 5-minute updates, and cosine-based consistency metrics (-1..1). To stay fast and frugal, I added 2-hour/0.25° smart caching, on-demand weather loads, request throttling (200ms), and concurrency limits (≤5), cutting external requests by ~99.98% while keeping sub-second drill-downs. I chose Open-Meteo because it’s global, keyless, and offers exactly the wind fields needed to validate balloon drift scientifically.

- Specialization & Collaboration: I’m a thoughtful frontend engineer who communicates clearly, ships fast, and designs APIs/UI contracts that make teammates’ lives easier.
- Why Open-Meteo? It’s global, free, requires no API key, and exposes precisely the 10m wind vectors and temperature needed to validate meteorological models, detect anomalies, and teach geospatial/data-science concepts with a live, real-world dataset.