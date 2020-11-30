# Millchan
**Millchan** is a P2P imageboard engine for the [ZeroNet](https://github.com/HelloZeroNet/ZeroNet) network.

That means that Millchan is _fast_, _decentralized_ and _anonymous_ (if you enable ZeroNet's built-in [Tor](https://www.torproject.org/) support).

If you have ZeroNet running you can check Millchan's live instance at:
[http://127.0.0.1:43110/1ADQAHsqsie5PBeQhQgjcKmUu3qdPFg6aA/](http://127.0.0.1:43110/1ADQAHsqsie5PBeQhQgjcKmUu3qdPFg6aA/)


If you're looking into running your own version of Millchan using the files here you will have to create your own content.json files which are not included in this repository.

## Setting up your environment ##

1. Install `npm`, `node` and the gnu compiler collection for c++, which is `gcc-c++` for fedora or `g++` for debian.
2. Clone this repo in your site's folder.
3. Execute `npm install`
4. Execute `npm run dev` for development or `npm run prod` for production.
