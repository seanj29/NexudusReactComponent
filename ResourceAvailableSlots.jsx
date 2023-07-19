import React, { useEffect } from 'react';
import Link from 'next/link';
import { routes } from 'env/routes';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'next/router';
import { inject, observer } from 'mobx-react';
import withCustomComponent from 'ui/components/withCustomComponent';
import moment from 'moment';
let selectingDate = 'fromTime';
export const ResourceAvailableSlots = withCustomComponent(
  'ResourceAvailableSlots'
)(
  inject(
    'authStore',
    'bookingsStore'
  )(
    withRouter(
      observer(
        ({
          id,
          selectDates,
          fromTime,
          toTime,
          authStore,
          bookingsStore,
          componentName,
          resource,
          isSidePopup,
        }) => {
          const { t } = useTranslation();
          const { availabilitiesAt } = bookingsStore;
          const $ = window.$;
          const tooltipName = `available-slot-tooltip-${id}`;

          const selectedFromTime = fromTime || bookingsStore.fromTime;
          const selectedToTime = toTime || bookingsStore.toTime;
          const initToolTips = () => {
            const toolTipEls = $(`[data-toggle="${tooltipName}"]`);
            if (toolTipEls.length > 0) {
              toolTipEls.tooltip({
                html: true,
                title: function () {
                  return $(this).attr('data-tooltip');
                },
              });
            }
          };

          useEffect(() => {
            bookingsStore
              .loadAvailabilityAt({
                customer: authStore.customer,
                guid: resource.UniqueId,
                startTime: moment(selectedFromTime)
                  .startOf('day')
                  .locale('en')
                  .format('YYYY-MM-DD'),
              })
              .then(initToolTips);

            return () => {
              const toolTipEls = $(`[data-toggle="${tooltipName}"]`);
              toolTipEls.tooltip('dispose');
            };
          }, [selectedFromTime, resource]);

          const selectDate = (date) => {
            selectDates(selectingDate, date);
            selectingDate = selectingDate == 'fromTime' ? 'toTime' : 'fromTime';
          };

          const hasShifts =
            resource && resource.Shifts && resource.Shifts.length > 0;

          let currentSlot = moment().startOf('day').add(-30, 'minutes');
          let nextSlot = moment().startOf('day');

          return (
            <>
              {/* {hasShifts && !isSidePopup && (
                <div className="mt-12 my-3 bg-gray-200 rounded d-flex align-items-center justify-content-center w-100">
                  <i className="icon-bookings fs-20 text-gray-700 mr-6"></i>
                  <span className="fs-14 fw-500">
                    {t('Select time slot to see availability.')}
                  </span>
                </div>
              )} */}

              <div
                className="bookings-available-slots"
                data-component-name={componentName}
              >
                <>
                  {availabilitiesAt[resource.UniqueId]?.AvailableSlots?.map(
                    (slot, i) => {
                      const booked = slot.Booked;
                      currentSlot.add(30, 'minutes');
                      nextSlot.add(30, 'minutes');

                      return (
                        <div
                          key={i}
                          data-toggle={tooltipName}
                          data-tooltip={
                            hasShifts
                              ? ''
                              : `${moment(slot.Date).format('LT')} - ${moment(
                                  slot.Date
                                )
                                  .add(30, 'minute')
                                  .format('LT')} <br/>${
                                  !slot.Available
                                    ? t('Not available')
                                    : booked
                                    ? t('Fully booked')
                                    : selectingDate == 'fromTime'
                                    ? t('select start time')
                                    : t('select end time')
                                }`
                          }
                          onClick={() =>
                            !hasShifts &&
                            selectDate(
                              selectingDate == 'fromTime'
                                ? slot.Date
                                : moment(slot.Date).add(30, 'minutes')
                            )
                          }
                          className={`slot${
                            moment(slot.Date) >= moment(selectedFromTime) &&
                            moment(slot.Date) < moment(selectedToTime)
                              ? ' selected'
                              : ''
                          }${
                            moment(slot.Date).format('LT') ==
                            moment(selectedFromTime).format('LT')
                              ? ' selected--from'
                              : ''
                          }${
                            moment(slot.Date).add(30, 'minute').format('LT') ==
                            moment(selectedToTime).format('LT')
                              ? ' selected--to'
                              : ''
                          } ${
                            !slot.Available
                              ? 'not-available'
                              : !booked
                              ? 'available'
                              : 'booked'
                          }`}
                        ></div>
                      );
                    }
                  )}
                </>
              </div>
            </>
          );
        }
      )
    )
  )
);
