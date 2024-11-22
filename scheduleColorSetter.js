import fs from "fs";
import yaml from "js-yaml";
import {createColorGradient} from "./colorUtil.js";
/*
const colors = [
    {
        start: '#42bad5',
        end: '#193e97',
    },
    {
        start: '#fdc300',
        end: '#fd5d00',
    },
    {
        start: '#adcd14',
        end: '#357602',
    },
    {
        start: '#ec7705',
        end: '#d21f08',
    },
    {
        start: '#0cd4d2',
        end: '#029078',
    },
    {
        start: '#e455c7',
        end: '#b01d61'
    },
    {
        start: '#f9a900',
        end: '#e33600'
    }
]
*/
const colors = [
    {
        start: '#3484bf',
        end: '#3484bf',
    },
    {
        start: '#fb9900',
        end: '#fb9900',
    },
    {
        start: '#7aa70c',
        end: '#7aa70c',
    },
    {
        start: '#dd5501',
        end: '#dd5501',
    },
    {
        start: '#06b8aa',
        end: '#06b8aa',
    },
    {
        start: '#d23d99',
        end: '#d23d99'
    },
    {
        start: '#f07800',
        end: '#f07800'
    }
]

async function main() {

    console.log(`Current directory: ${process.cwd()}`);

    const year = 2024;

    try {
        const fileContents = fs.readFileSync(`./src/content/schedules/${year}.yaml`, 'utf8');
        const scheduleData = yaml.load(fileContents);
        for (const week of scheduleData.weeks) {
            const dayRefs = week.days

            for (let i = 0; i < dayRefs.length; i++) {
                const dayRef = dayRefs[i]
                const dayPath = `./src/content/scheduleDays/${dayRef}.yaml`
                const dayData = yaml.load(fs.readFileSync(dayPath, 'utf8'));
                const gradient = createColorGradient(colors[i].start, colors[i].end, dayData.streams.length)
                // const controlG = createColorGradient(colors[i].start, colors[i].end, 2)
                // const control = controlG[1]
                // const gradient2 = createColorGradientFromColor(control, dayData.streams.length)
                for (let j = 0; j < dayData.streams.length; j++) {
                    const color = gradient[j]
                    const color2 = gradient[j + 1]
                    if (!dayData.streams[j].style) {
                        dayData.streams[j].style = {
                            background: {
                                colors: [color, color2]
                            }
                        }
                    }
                    dayData.streams[j].style.background.colors = [color, color2]
                }
                fs.writeFileSync(dayPath, yaml.dump(dayData));
            }
        }
    } catch (error) {
        console.error(error);
    }
}


main()
