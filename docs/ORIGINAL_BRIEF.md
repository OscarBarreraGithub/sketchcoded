# Original product brief

Saved on 2026-09-07. The user’s original request follows verbatim.

---

We're going to build a new repo here. It is a simple UI for designing UIs and connecting the app flow. think of the visual swift design with flowcharts, but much much more reliant on LLMs

here is the idea: I draw a few screenshots of what I want my UI to look like. It can be on a chalkboard or on pen and paper or however. Then I can click and drop them in a library shown in the UI (or rather I point the localhost button to the folder where my screenshots live and then I can now see them in a panel.

I can then drag and drop the images onto a flexible workspace. like a bulletin board. I think that would be good. make it so I can drop and we have a stupid little animtion where it is now held up by tacks

I then have to title the image. it gets added as a little scrap of paper on top. like if it was a real bulletin board. make it easy to zoom in and out of the board

then I can drag another image and place it wherever I want. imagine this is the screen that I'd want to happen when I click a butotn on the first screen. so, having both screens on my board, I'd click the first image, drop a pin on somewhere on the screen, and give it a high level description for what it should be&#x20;

imagine we're making a chat app. so on the first image there is a left panel where I've drawn boxes and hav e more or less made it look like a little icon and name and "last seen" message but very sloppy and drawn sketched out. I'd place a pin over one of the conversations and say "here is a panel of most recent chats. clicking on any one of them will open that chat in a new window and it will look like:"

and then I close the image (so we're back on the bulletinboard view) and connect a little piece of yarn to the next image which i what we'd expect to see when opening the chat. I can then click on the yarn, which pops up a little window which lets me fill in all the details I need to actually connect the logic. so in it I'd say "this is the view for each user, so it shoul dopen when \_\_\_ but if blocked shows \_\_\_ and ...." basically I put all the logic, and from it I get to string together all my other images. in this way, one pin can feed multiple yarns for if statements basically.

this is not new of course, but the way we are doing it with LLMs is.

because once we build out the entire board, we will have a very nice review loop so we can make sure it gets done right. We'll have an agentic workflow designed by us. but forget about that for now. Lets get the UI set up so that we have a useful product to feed the later workflow. Of course visually it is represented by yarn and pins but the important part is figuring out what the right way of presenting the information to an LLM is. my guess is just representing it as a graph with nodes and edges and just having the logic flow from there.

the only thing I want from you on the agentic side is to, since you're mkaing this data representation, figure out the best way of implementing an auto check so that we don't have any pages that are only accesible one way (e.g make sure the graph always can be traversed backwards... although this is more subtle because imagine a login page but then this should be able to be bypassed I guess. figure these details out. maybe internally in the graph representation we can surface the fact it is only one way but then the user (or the later LLM rather, with knowledge that of course it's fine because it is a login page) can bypass that one, and go one by one through them to make sure it is ok. so in this way, it is fine have these auto checks. if there are any other checks just make sure no subtleties like this are unaddresssed.

And then the last thing is to have a button so we can "test" the UI from our screenshots. so we can click through and confirm we have the right set up but with our very crude sketches. I think that is a great demo to have. you can click on the little pins and then from this navigate the screen. If multiple yarns for one pin, show the multiple options I guess? figure this out. maybe just the different summaries of how you'd end up at each one or sometihng. and then we can click on one and from that it continues like normal in the demo.


there is a lot here. So, one thing you should do is save this prompt as a .md file, and every once in a while when you stop and check your work or run a review, you have the review with this prompt in mind. Maybe set the goal as ok'ing all the points I put in here. You should also work in a way where you're tracking all your progress so we don't forget anything or lose our place if compacting.&#x20;

before starting, do you need anything from me? anything that is unclear?
