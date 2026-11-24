import json
N={}
def lane(x0,cols,rows):
    for r,row in enumerate(rows):
        for c,item in enumerate(row):
            if item: N[item[0]]=dict(x=x0+c*230,y=150+r*520,label=item[1],note=item[2] if len(item)>2 else '')
lane(40,1,[[('home-empty','Start, nothing picked','Discover if an EV makes sense; Keep it short opens the five questions')],[('home-picked','Start, topics picked','Pressed keys, drag handle to reorder')],[('home-results','Start, results exist','Blue button turns into Recalculate')],[('assistant','Assistant','Open from any screen')],[('assistant-check','Check in the chat','Same questions inside the chat; free text is turned into answers')],[('assistant-done','Results in the chat','Summary in the chat, then open the full summary')]])
N['landing']=dict(x=40,y=-370,label='Landing page',note='What the tool is, data sources, Start my journey (once per visit)')
N['landing-sources']=dict(x=270,y=-370,label='Landing, data sources open',note='Name on the left lights up; what it feeds on the right')
lane(330,3,[[('q6','Q · Let’s talk charging','Only when Charging is picked'),('q1','Q · Where do you live?'),('q3','Q · Which trips?')],
            [('q2','Q · Drive to work?'),('q4','Q · Other regular trips','Range only, or own trips'),('q5','Q · Charge at home today?')],
            [('q7','Q · Which car today?'),('q8','Q · Your car (age, km)'),('q9','Q · Which electric car?','Size, new or used, price = budget. Saved as your choice')],
            [('q10','Q · Who travels with you?'),('q-missing','Q · One more thing','n8n says an answer is missing')],
            [('q11','Q · Battery: what to know?','Battery topic opened on its own'),('q12','Q · About the used car','Used EV check')]])
lane(330,4,[[],[],[],[],[],[('compass-1','Compass · Where are you starting from?','Christian: 5 questions, each can be skipped'),('compass-3','Compass · What holds you back?'),('compass-4','Compass · What do you need to know?','Options depend on the answer before'),('compass-card','Your starting point','Main question, then the topics that answer it')]])
lane(1070,1,[[('batch','Calculating your results','2+ topics')],[('loading','Calculating one topic')],[('error','Something went wrong')]])
lane(1350,1,[[('summary-loading','Summary, AI still writing')],[('summary','Summary · Simple')],[('summary-numbers','Summary · With the numbers')]])
lane(1640,5,[[('r-B1','Range & battery life'),('r-B2','Charging access'),('r-B3','Costs & resale value'),('r-B7','Climate impact'),('r-B4','Lifestyle match')],
             [('r-B1-full','Range · Full analysis open'),('r-B2-full','Charging · Full analysis open'),('r-B3-full','Costs · Full analysis open'),('r-B7-full','Climate · Full analysis open'),('r-B4-full','Which car · Full analysis open')],
             [('r-B2-email-site','Charging · map point open'),('r-B2-edit','Edit your inputs (own screen)')],
             [('r-B6','Battery details','Only if Range and Costs are not done'),('r-B6-used','Used EV battery check')]])
lane(2900,1,[[('answers','Your answers','List icon in the top bar')],[('answer-edit','Change one answer')],[('account-create','Save your answers · Create')],[('account-login','Save your answers · Log in')],[('account-in','Your account (logged in)')],[('reset','Delete your answers?','From Start and Your answers')]])
lane(3180,1,[[('mail','Write email','From Charging, Back returns')]])
LANES=[(40,1,'Start'),(330,3,'Questions · each asked once for all picked topics'),(1070,1,'Calculating'),(1350,1,'Summary'),(1640,5,'Five topic results · tap any after Summary'),(2900,1,'Your answers and account'),(3180,1,'Email')]
_dy=max(0,150-min(v['y'] for v in N.values()))
for v in N.values(): v['y']+=_dy
E=[('landing','home-empty','Start my journey','m'),('landing','landing-sources','See our data sources','a'),('home-empty','home-picked','tap topics','m'),('home-picked','q6','Continue','m'),('home-empty','q1','Check all topics','a'),('home-empty','assistant','own words','a'),('home-empty','compass-1','Not sure where to start?','a'),('compass-1','compass-3','','q'),('compass-3','compass-4','','q'),('compass-4','compass-card','','q'),('compass-card','q6','Start with the topics','m'),('assistant','assistant-check','I want my ideal car…','a'),('assistant-check','assistant-done','last answer','a'),
 ('home-results','batch','Recalculate','m'),('home-results','summary','Your results','a'),
 ('home-picked','reset','Start fresh','a'),('home-results','reset','Start fresh','a'),('answers','reset','Delete your answers','a'),
 ('q6','q1','','q'),('q1','q3','','q'),('q3','q2','','q'),('q2','q4','','q'),('q4','q5','','q'),('q5','q7','','q'),('q7','q8','','q'),('q8','q9','','q'),('q9','q10','','q'),
 ('q10','batch','last question, 2+ topics','m'),('q5','loading','last question, 1 topic','a'),('q11','q12','used EV','q'),
 ('batch','summary','done','m'),('loading','r-B2','result','m'),('loading','error','','a'),('error','loading','Try again','a'),('loading','q-missing','answer missing','a'),
 ('summary-loading','summary','AI text arrives','a'),('summary','summary-numbers','toggle','a'),
 ('summary','r-B2','tap a topic','m'),('summary','r-B1','','m'),('summary','r-B3','','m'),('summary','r-B7','','m'),('summary','r-B4','','m'),('summary','r-B6','Battery row, only without Range/Costs','a'),('summary','account-create','Save your answers','a'),
 ('r-B2','r-B2-full','Full analysis','m'),('r-B2-full','r-B2-email-site','tap a map point','a'),('r-B2-full','mail','Write email','a'),('r-B2','r-B2-edit','Edit your inputs','a'),('r-B2-edit','loading','Recalculate','a'),
 ('r-B1','r-B1-full','Full analysis','m'),('r-B3','r-B3-full','Full analysis','m'),('r-B7','r-B7-full','Full analysis','m'),('r-B4','r-B4-full','Full analysis','m'),
 ('r-B2','r-B1','Continue with next topic','a'),('r-B1','q12','Check a used EV','a'),('q12','r-B6-used','','a'),
 ('answers','answer-edit','pencil','m'),('answer-edit','batch','Save, results recalculated','a'),('answers','r-B4','Done / Not checked yet','a'),('r-B4','batch','Choose a car: it becomes your choice, Costs and Climate recalculated','a'),('r-B3','batch','Make this my choice','a'),('summary','answer-edit','Change the electric car','a'),
 ('account-create','account-login','Log in','a'),('account-login','account-in','','a')]
data=dict(nodes=N,edges=E,lanes=LANES)
html=open('' + __import__('os').path.dirname(__file__) + '/tpl.html',encoding='utf-8').read().replace('/*DATA*/',json.dumps(data))
open(__import__('os').environ.get('MAP_OUT','/tmp/map/site')+'/index.html','w',encoding='utf-8').write(html)
print(len(N),'nodes',len(E),'edges')
