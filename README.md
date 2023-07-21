# Famous-Quotes.uk

The first website I ever created was a quotes website. It was awful, but I felt the idea was fundamentally sound. With 3-4 years professional development behind me, I revisited the premise and built a well-tested containerised application.

Fundamentally - it's easy to find lists of other people's favourite quotes, but there doesn't seem to be anywhere to curate your own. Also, to find a specific quote, I often had to google - their was no authoritative and easily-searchable website to act as the "go-to" resource. I hope that when this site is launched properly, it could eventually become that authoritative source.

## Stack

* Database = MySQL
* Backend = Django rest API
* Frontend = React

## Main features

* Categorisation of quotes - if you want something to motivate you for a day of hard work, or something related to education, this website should have it all. 
  * And, of course, _programming_ is a category as well. 
* Vote for your favourite quotes.
  * Throttling in place to avoid spam voting.
* Ability to submit new quotes<sup>+</sup>.
  * Requires authentication to prevent spam from bots (lesson learned from the original iteration of this site).
* Ability to report quotes for misattribution, duplication, or report as offensive.
* Ability to curate your own lists of your favourite quotes<sup>+</sup>.
* _Quote of the day_ - a single high-rated quote from the pre-defined categories that will not repeat inside 3 months
* The data-scientist in me wanted to make voting data for quotes available, so they all have vote-histories charted and tabled. Probably not of interest for 95% of users.
* Create "Quote views" with the quote overlaid on a pre-chosen choice of graphics (all from Unsplash, so royalty-free).
* Users can comment on quotes<sup>+</sup>.
<sup>+</sup>Requires authentication

## Planned upcoming features

* Email newsletter<sup>+</sup> - users can subscribe to 'Quote of the day' for chosen categories on chosen days & times of the week and a cron-job will trigger emailing lists.
* Improved SEO - I've learned a lot about SEO for a React-app (ad how not to do it 😅)

## Novel development features

### Request throttling 

My hosting database struggles if there are more than 200 connections in a rolling 60-second period (it's not from unclosed connections, I have checked). Therefore, I developed an in-memory `IpThrottle` class which, if it suspects abuse from a given IP address, will effectively reject their requests until a non-abusive level of traffic is maintained.

### Appropriate Routing

I was really struggling to route requests to the frontend for 404s - I spent a lot of time playing around with `.htacess` files. Then I realised that Django has a router, so I instead configured Django URLs to catch 404s and route them to the frontend. Issue fixed immediately.
