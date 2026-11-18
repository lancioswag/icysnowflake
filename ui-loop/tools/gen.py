import json
N={}
def lane(x0,cols,rows):
    for r,row in enumerate(rows):
        for c,item in enumerate(row):
            if item: N[item[0]]=dict(x=x0+c*230,y=150+r*520,label=item[1],note=item[2] if len(item)>2 else '')
lane(40,1,[[('home-empty','Start, nothing picked')],[('home-picked','Start, topics picked','Pressed keys, drag handle to reorder')],[('home-results','Start, results exist','Blue button turns into Recalculate')],[('assistant','Assistant','Open from any screen')]])
lane(330,3,[[('q6','Q · What would you like to know?','Only when Charging is picked'),('q1','Q · Where do you live?'),('q3','Q · Which trips?')],
            [('q2','Q · Drive to work?'),('q4','Q · Other regular trips','Range only, or own trips'),('q5','Q · Charge at home today?')],
            [('q7','Q · Which car today?'),('q8','Q · Your car (age, km)'),('q9','Q · Second car?')],
            [('q10','Q · Who travels with you?'),('q13','Q · Budget','Which car fits me only'),('q-missing','Q · One more thing','n8n says an answer is missing')],
            [('q11','Q · Battery: what to know?','Battery topic opened on its own'),('q12','Q · About the used car','Used EV check')]])
lane(1070,1,[[('batch','Calculating your results','2+ topics')],[('loading','Calculating one topic')],[('error','Something went wrong')]])
lane(1350,1,[[('summary-loading','Summary, AI still writing')],[('summary','Summary · Simple')],[('summary-numbers','Summary · With the numbers')]])
lane(1640,5,[[('r-B1','Range & battery life'),('r-B2','Charging access'),('r-B3','Costs & resale value'),('r-B7','Climate impact'),('r-B4','Which car fits me')],
             [('r-B1-full','Range · Full analysis open'),('r-B2-full','Charging · Full analysis open'),('r-B3-full','Costs · Full analysis open'),('r-B7-full','Climate · Full analysis open'),('r-B4-full','Which car · Full analysis open')],
             [('r-B2-email-site','Charging · map point open'),('r-B2-edit','Edit your inputs (own screen)')],
             [('r-B6','Battery details','Only if Range and Costs are not done'),('r-B6-used','Used EV battery check')]])
lane(2900,1,[[('answers','Your answers','List icon in the top bar')],[('answer-edit','Change one answer')],[('account-create','Save your answers · Create')],[('account-login','Save your answers · Log in')],[('account-in','Your account (logged in)')],[('reset','Delete your answers?','From Start and Your answers')]])
lane(3180,1,[[('mail','Write email','From Charging, Back returns')]])
LANES=[(40,1,'Start'),(330,3,'Questions · each asked once for all picked topics'),(1070,1,'Calculating'),(1350,1,'Summary'),(1640,5,'Five topic results · tap any after Summary'),(2900,1,'Your answers and account'),(3180,1,'Email')]
E=[('home-empty','home-picked','tap topics','m'),('home-picked','q6','Continue','m'),('home-empty','q1','Check all topics','a'),('home-empty','assistant','own words','a'),
 ('home-results','batch','Recalculate','m'),('home-results','summary','Your results','a'),
 ('home-picked','reset','Start fresh','a'),('home-results','reset','Start fresh','a'),('answers','reset','Delete your answers','a'),
 ('q6','q1','','q'),('q1','q3','','q'),('q3','q2','','q'),('q2','q4','','q'),('q4','q5','','q'),('q5','q7','','q'),('q7','q8','','q'),('q8','q9','','q'),('q9','q10','','q'),('q10','q13','','q'),
 ('q13','batch','last question, 2+ topics','m'),('q5','loading','last question, 1 topic','a'),('q11','q12','used EV','q'),
 ('batch','summary','done','m'),('loading','r-B2','result','m'),('loading','error','','a'),('error','loading','Try again','a'),('loading','q-missing','answer missing','a'),
 ('summary-loading','summary','AI text arrives','a'),('summary','summary-numbers','toggle','a'),
 ('summary','r-B2','tap a topic','m'),('summary','r-B1','','m'),('summary','r-B3','','m'),('summary','r-B7','','m'),('summary','r-B4','','m'),('summary','r-B6','Battery row, only without Range/Costs','a'),('summary','account-create','Save your answers','a'),
 ('r-B2','r-B2-full','Full analysis','m'),('r-B2-full','r-B2-email-site','tap a map point','a'),('r-B2-full','mail','Write email','a'),('r-B2','r-B2-edit','Edit your inputs','a'),('r-B2-edit','loading','Recalculate','a'),
 ('r-B1','r-B1-full','Full analysis','m'),('r-B3','r-B3-full','Full analysis','m'),('r-B7','r-B7-full','Full analysis','m'),('r-B4','r-B4-full','Full analysis','m'),
 ('r-B2','r-B1','Continue with next topic','a'),('r-B1','q12','Check a used EV','a'),('q12','r-B6-used','','a'),
 ('answers','answer-edit','pencil','m'),('answer-edit','batch','Save, results recalculated','a'),('answers','r-B4','Done / Not checked yet','a'),
 ('account-create','account-login','Log in','a'),('account-login','account-in','','a')]
data=dict(nodes=N,edges=E,lanes=LANES)
html=open('' + __import__('os').path.dirname(__file__) + '/tpl.html',encoding='utf-8').read().replace('/*DATA*/',json.dumps(data))
open(__import__('os').environ.get('MAP_OUT','/tmp/map/site')+'/index.html','w',encoding='utf-8').write(html)
print(len(N),'nodes',len(E),'edges')
