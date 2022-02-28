import {createElement} from "../utils";

test('createElement video', () => {
    let elVideo = createElement("<video muted='muted' loop='loop'/>")
    // expect(sum(1, 2)).toBe(3)
    expect(elVideo).not.toBeNull()
    expect(elVideo).toBeInstanceOf(HTMLVideoElement)
    expect(elVideo.loop).toBe(true)
    expect(elVideo.muted).toBe(false)
});