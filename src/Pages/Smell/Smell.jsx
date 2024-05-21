import React from 'react';
import './Smell.css';
import circle1 from '../../assets/circle1.png';
import circle2 from '../../assets/circle2.png';

const Smell = () => {
  return (
    <div className="container">
      <div className="container-background">
        <img className="circle1" src={circle1} alt="background" />
        <img className="circle2" src={circle2} alt="background" />
        <div className="color"></div>
      </div>

      <div className="container-header">
        <h1>Flavour Communication</h1>
      </div>

      <div className="container-body">
        <div className="test">
          <h3>Olfactory Interface</h3>
        </div>

        <div className="flex-container">
          <div className="box-test">
            {Array.from({ length: 6 }, (_, i) => (
              <div className="chanel" key={i}>
                <p>#{i + 1}</p>

                <div className="toggleChanel">
                  <input type="checkbox" id={`checkChanel${i + 1}`} hidden />
                  <label htmlFor={`checkChanel${i + 1}`}></label>
                </div>

                <input type="text" id="smellName" placeholder="Enter smell name" />

                <div className="duration">
                  <input type="text" id="duration" value="1000" />

                  <div className="toggleDuration">
                    <input type="checkbox" id={`checkDurationInf${i + 1}`} hidden />
                    <label htmlFor={`checkDurationInf${i + 1}`}><p>Inf</p></label>
                  </div>
                </div>

                <div className="toggleDirection">
                  <input type="checkbox" id={`checkDirection${i + 1}`} hidden />
                  <label htmlFor={`checkDirection${i + 1}`}>
                    <p className="push">Push</p>
                    <p className="pull">Pull</p>
                  </label>
                </div>

                <input type="button" id="activeButton" value="Activate" />
                <label htmlFor="activeButton"></label>

                <input type="button" id="deactiveButton" value="Deactivate" className="hidden" />
                <label htmlFor="deactiveButton"></label>
              </div>
            ))}
          </div>

          <div className="box-button"></div>
        </div>
      </div>
    </div>
  );
};

export default Smell;
