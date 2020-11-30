
/* description: Parses and formats text. */

/* lexical grammar */
%lex

BOLD			[']{3}
STRIKE			[~]{2}
ITALIC			[']{2}
UNDERLINE		[_]{2}
SPOILER			[*]{2}
HEADING			[=]{2}
SNIPPET			[`]
CODE_START		\["code"\]
CODE_END		\[\/"code"\]

%x bold strike italic underline spoiler heading snippet link code

%%

<bold>{BOLD}               %{ this.popState(); return "BOLD_END"; %}
{BOLD}                     %{ this.pushState("bold"); return 'BOLD_START'; %}
<strike>{STRIKE}           %{ this.popState(); return "STRIKE_END"; %}
{STRIKE}                   %{ this.pushState("strike"); return 'STRIKE_START'; %}
<italic>{ITALIC}           %{ this.popState(); return "ITALIC_END"; %}
{ITALIC}                   %{ this.pushState("italic"); return 'ITALIC_START'; %}
<underline>{UNDERLINE}     %{ this.popState(); return "UNDERLINE_END"; %}
{UNDERLINE}                %{ this.pushState("underline"); return 'UNDERLINE_START'; %}
<spoiler>{SPOILER}         %{ this.popState(); return "SPOILER_END"; %}
{SPOILER}                  %{ this.pushState("spoiler"); return 'SPOILER_START'; %}
<heading>{HEADING}         %{ this.popState(); return "HEADING_END"; %}
{HEADING}                  %{ this.pushState("heading"); return 'HEADING_START'; %}
<snippet>{SNIPPET}         %{ this.popState(); return "SNIPPET_END"; %}
{SNIPPET}                  %{ this.pushState("snippet"); return 'SNIPPET_START'; %}
{CODE_START}               %{ this.pushState("code"); return "CODE_START"; %}
<code>{CODE_END}           %{ this.popState(); return "CODE_END"; %}

<bold>.+?(?={BOLD})                 return 'INNERTEXT'
<strike>.+?(?={STRIKE})             return 'INNERTEXT'
<italic>.+?(?={ITALIC})             return 'INNERTEXT'
<underline>.+?(?={UNDERLINE})       return 'INNERTEXT'
<spoiler>.+?(?={SPOILER})           return 'INNERTEXT'
<heading>.+?(?={HEADING})           return 'INNERTEXT'
<snippet>.+?(?={SNIPPET})           return 'INNERTEXT'
<code>[\s\S]+?(?={CODE_END})        return "INNERTEXT"


<INITIAL>[\[].+?(?=\][^\(])       return 'INNERTEXT'
<INITIAL>[\[].+?(?=\]\()          %{ this.pushState("link"); return 'LINKTEXT'; %}
<link>.+?(?=[\)])                 %{ this.input(); this.popState(); return 'LINKHREF'; %}

<<EOF>>                             return 'EOF'
\s|.                                return 'OTHER'

/lex

%{
	function handleTag(tag, input) {
		switch(tag) {
			case "BOLD":
				return `<strong>${input}</strong>`;
			case "ITALIC":
				return `<i>${input}</i>`;
			case "UNDERLINE":
				return `<u>${input}</u>`;
			case "STRIKE":
				return `<span class='strike'>${input}</span>`;
			case "SPOILER":
				return `<span class='spoiler'>${input}</span>`;
			case "HEADING":
				return `<span class='heading'>${input}</span>`;
			case "SNIPPET":
				return `<span class='snippet'>${input}</span>`;
			case "CODE":
				return `<pre class="code">${input.trim()}</pre>`;
			default:
				return input;
		}
	}
%}

%start result

%% /* language grammar */

result
    : text EOF
        {return $1;}
    ;

text
	: special
	| normal
	| text normal
		{$$ = $1 + $2;}
	| text special
		{$$ = $1 + $2;}
	;

special
	: BOLD_START INNERTEXT BOLD_END
		{$$ = handleTag("BOLD", $2);}
	| ITALIC_START INNERTEXT ITALIC_END
		{$$ = handleTag("ITALIC", $2);}
	| UNDERLINE_START INNERTEXT UNDERLINE_END
		{$$ = handleTag("UNDERLINE", $2);}
	| STRIKE_START INNERTEXT STRIKE_END
		{$$ = handleTag("STRIKE", $2);}
	| SPOILER_START INNERTEXT SPOILER_END
		{$$ = handleTag("SPOILER", $2);}
	| HEADING_START INNERTEXT HEADING_END
		{$$ = handleTag("HEADING", $2);}
	| SNIPPET_START INNERTEXT SNIPPET_END
		{$$ = handleTag("SNIPPET", $2);}
	| CODE_START INNERTEXT CODE_END
		{$$ = handleTag("CODE", $2);}
	| LINKTEXT LINKHREF
		{
			var desc = $1.slice(1), link = $2.slice(2,-1);
			try {
				var url = link.startsWith("/") ? new URL(link, self.origin) : new URL(link);
				$$ = `<a href='${url.href}' target='_blank' rel='noopener'>${desc}</a>`
			} catch (e) {
				$$ =  `<a href='#'>${desc}</a>`
			}
		}
	;

normal
	: INNERTEXT
		{$$ = yytext;}
	| OTHER
		{$$ = yytext;}
	;
