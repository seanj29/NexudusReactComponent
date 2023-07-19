import React, { useState, useEffect } from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'next/router';
import moment from 'moment';
import DropDownList from 'react-widgets/DropdownList';
import { scrollToAvailableTime } from 'ui/assets/js/application';

let instancesCount = 0

export const TimeInputField = (
  inject('appStore')(
    withRouter(
      observer(
        ({
          componentName,
          appStore,
          value,
          name,
          onChange,
          errors,
          helpText,
          classes,
          containerClasses,
          id,
          label,
          dropUp,
          allowPastDates,
        }) => {
          const [touched, setTouched] = useState(false);
          const [open, setOpen] = useState(false);
          const [divId, setDivId] = useState('');
 
          useEffect(() => {
          {/*console.log(startTime.toDateString().startsWith("Thu"))*/}
            instancesCount += 1;
            setDivId(`time-input-field-${instancesCount}`);
          }, []);

          let startTime;

          const { configuration } = appStore;
          const currentDate = moment().toDate();

          startTime = moment(value).startOf('day').toDate();
          

          const getTimeSlots = () => {
            let timeSlots = {
              all: [],
              past: []
            };
            let endTime = moment(value).endOf('day');

            for (
              let tempDate = startTime;
              moment(tempDate) <= endTime;
              tempDate = moment(tempDate)
                .clone()
                .add(
                  typeof window !== 'undefined'
                    ? window.bookingTimeStep ?? 15
                    : 15,
                  'minutes'
                )
                .toDate()
            ) {
              const openDate = moment(startTime).add(7.75, 'hours');
              const closeDate = moment(startTime).add(22.25, 'hours');
              const tempDateISO = moment(tempDate).toISOString();
              if (tempDate > openDate && tempDate < closeDate){
              timeSlots.all.push(tempDateISO);
              }
              if (tempDate < currentDate) {
                timeSlots.past.push(tempDateISO);
              }
            }
            return timeSlots;
          };

          const onDropdownChange = (dateISO) => {
            const date = moment(dateISO).toDate();
            setTouched(true);

            if (!value) {
              onChange(date, null); 
              return;
            }
            let currentDate = value ?? new Date();
            let clone = moment(currentDate).clone().toDate();

            clone.setMinutes(date.getMinutes());
            clone.setHours(date.getHours());

            onChange(name, clone);
          };

          const onFocus = () => {
            setTouched(true);
          };

          const timeSlots = getTimeSlots().all;
          const pastTimeSlots = getTimeSlots().past;

          const hasErrors = errors && errors.length > 0;
          const timeIconElement = (
            <i className="icon-time fs-24 text-gray-600"></i>
          );

          const onToggle = () => {
            const isOpen = !open;
            setOpen(!open);
            if(isOpen) {
              scrollToAvailableTime(divId, pastTimeSlots.length);
            }
          }

          return (
            <div
              id={divId}
              className={`form-group mb-0 
              ${classes ? classes : ''}
            custom-timepicker time`}
            >
              {label && (
                <label className="control-label" htmlFor={id}>
                  {label}
                </label>
              )}
              <DropDownList
                id={id}
                open={open}
                onToggle={onToggle}
                dropUp={dropUp}
                data={timeSlots}
                disabled={allowPastDates ? [] : pastTimeSlots}
                textField={(value) => moment(value).format('LT')}
                value={value}
                busy={!timeSlots.length}
                selectIcon={timeIconElement}
                containerClassName={`form-group-sm 
                ${containerClasses ? containerClasses : ''}
              mb-0`}
                onChange={(val) => onDropdownChange(val)}
                onFocus={onFocus}
              />
              {hasErrors && (
                <div className="invalid-feedback">{errors.join(', ')}</div>
              )}
              {helpText && (
                <small class="form-text text-muted">{helpText}</small>
              )}
            </div>
          );
        }
      )
    )
  )
);
