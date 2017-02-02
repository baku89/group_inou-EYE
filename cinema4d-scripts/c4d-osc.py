# Python Tag in C4D's project

import c4d
import SimpleOSC as osc
from OSC import OSCClient, OSCMessage
import math

oscToNW = None

mainFocal = 17
imaiFocal = 17
cpFocal = 17

prevImai = -1000
prevCp = -1000

def onFrameChanged(addr, tags, data, source):
    global oscToNW, mainFocal, imaiFocal, cpFocal
    global prevImai, prevCp
    
    time = c4d.BaseTime(data[0], 24)
    doc.SetTime(time)
    
    print "changed to %s" % data[0]
    
    obj = op.GetObject()
    reader = obj[c4d.ID_USERDATA,9]
    
    mainFocal = reader[c4d.ID_USERDATA,13]
    cpFocal = reader[c4d.ID_USERDATA,20]
    imaiFocal = reader[c4d.ID_USERDATA,24]
    
    
    # changed
    curtCp  = math.floor(reader[c4d.ID_USERDATA,14] / 15) / 2
    curtImai = math.floor(reader[c4d.ID_USERDATA,15] / 15) / 2
    
    if curtCp != prevCp:
        cpAngle = 1
    else:
        cpAngle = 0
        
    if curtImai != prevImai:
        imaiAngle = 1
    else:
        imaiAngle = 0
        
    print curtCp
        
    prevCp = curtCp
    prevImai = curtImai
    
    osc.initOSCClient(port=1241)
    osc.sendOSCMsg("/focallength", [mainFocal, cpFocal, imaiFocal, cpAngle, imaiAngle])
    print "sended!!!"
    

def main():
    global mainFocal, imaiFocal, cpFocal
    
    if osc.server == 0:
        print "init osc server"
        osc.initOSCServer(port=1243)
        osc.startOSCServer()
    
    osc.setOSCHandler(address='/frame', hd=onFrameChanged)