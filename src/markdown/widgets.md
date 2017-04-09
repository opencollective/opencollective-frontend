# For backers and sponsors

To show the list of collectives that you are backing on your website, just add this script:

    <script src="https://opencollective.com/:username/widget.js"></script>

E.g. http://polycode.co.uk

![](https://cl.ly/01082x0W042G/Screen%20Shot%202017-02-27%20at%205.22.09%20PM.png)

# For collectives

## Donate button

    <iframe frameborder=0 src="https://opencollective.com/:collectiveSlug/donate/button?color=[white|blue]" width=300 height=50></iframe>

Just replace `:collectiveSlug` with the slug of your collective (e.g. webpack for https://opencollective.com/webpack).
Example:
<center><iframe frameborder=0 src="/webpack/donate/button" width=300 height=50></iframe><iframe frameborder=0 src="/webpack/donate/button?color=blue" width=300 height=50></iframe></center>


## Show backers and sponsors

Just add this script:

    <script src="https://opencollective.com/:collectiveSlug/banner.js"></script>

where `:collectiveSlug` is the slug of your collective, e.g. `apex` for https://opencollective.com/apex.

### Examples:
- http://apex.run/#links
![](https://cl.ly/3g2V3M200U2d/Screen%20Shot%202016-07-18%20at%204.34.48%20PM.png)

### How to customize it?

This will use the default styling of your `h1` and `h2` on your page.
You can target them with CSS to customize them:

    #opencollective-banner h1 {
      color: black;
    }

# Feedback

If you would like a different or custom widget, let us know. Send us your feedback to info@opencollective.com or join us on our slack: https://slack.opencollective.com.